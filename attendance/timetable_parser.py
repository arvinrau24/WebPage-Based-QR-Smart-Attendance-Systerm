import os
import json
import base64
import re
from datetime import datetime, timedelta
from io import BytesIO
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

DAY_MAP = {
    'isnin': 'Monday',
    'monday': 'Monday',
    'mon': 'Monday',
    'selasa': 'Tuesday',
    'tuesday': 'Tuesday',
    'tue': 'Tuesday',
    'rabu': 'Wednesday',
    'wednesday': 'Wednesday',
    'wed': 'Wednesday',
    'khamis': 'Thursday',
    'thursday': 'Thursday',
    'thu': 'Thursday',
    'jumaat': 'Friday',
    'friday': 'Friday',
    'fri': 'Friday',
}

TIMETABLE_PROMPT = """
Analyze this UTeM lecturer timetable (aSc Timetables format).

TIME GRID — READ CAREFULLY:
- The top row has LARGE bold hour labels (8:00 AM, 9:00 AM, 10:00 AM, …).
- Directly BELOW each large label is SMALL text showing that column's 1-hour slot
  (e.g. "8:00 - 9:00 AM", "9:00 - 10:00 AM", "2:00 - 3:00 PM").
- Each vertical column = exactly ONE hour. Use the SMALL sub-labels to identify columns.
- Do NOT measure a class from one large header to another distant large header.

CLASS BLOCKS:
- A coloured class box spans 1 or more adjacent hourly columns.
- start_time = the SMALL sub-label time at the LEFT edge of the box (first column it covers).
  Do NOT use a column to the left of where the box actually begins.
- Count how many hourly columns the box spans → columns_spanned (integer).
- end_time = start_time + columns_spanned hours.
  Examples:
    • Box covers 9:00-10:00 and 10:00-11:00 columns → start 09:00, end 11:00, columns_spanned 2
    • Box covers 2:00-3:00 PM and 3:00-4:00 PM → start 14:00, end 16:00, columns_spanned 2
    • Box covers three afternoon columns → columns_spanned 3, end = start + 3 hours
- Most teaching classes span 2 columns (2 hours). Some labs span 3 columns (3 hours).
- Never return a 4-hour duration unless the box clearly spans 4 columns.

DAYS (Malay row labels → English):
Isnin→Monday, Selasa→Tuesday, Rabu→Wednesday, Khamis→Thursday, Jumaat→Friday

INCLUDE ALL CLASSES — CRITICAL:
- Include EVERY coloured class/lab/project/admin block on the timetable.
- Standard faculty codes: BERR####, BERN#### (e.g. BERR3133, BERN2423).
- Many blocks have NO BERR code — still include them using the EXACT text in the cell:
  • "PD / IDP / MEng Project"
  • "PSM1 / PSM2"
  • Any other title printed inside the block
- Do NOT skip entries only because they lack a BERR#### pattern.

For each class entry return JSON with:
- course_code: BERR####/BERN#### when present; otherwise the full cell title (e.g. "PSM1 / PSM2")
- course_name: human-readable title exactly as shown on the timetable
- day (Monday/Tuesday/Wednesday/Thursday/Friday)
- start_time (24h HH:MM)
- end_time (24h HH:MM, must equal start + columns_spanned hours)
- columns_spanned (integer, number of hourly columns covered)
- room (e.g. BK4, or "" if none)

Skip only completely empty cells with no title and no class content.

Return ONLY a valid JSON array. No markdown, no backticks, no explanation.
"""


def convert_to_image_bytes(file_bytes, content_type):
    """Convert PDF or DOCX to PNG image bytes for Groq vision."""

    if 'pdf' in content_type:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype='pdf')
        page = doc[0]
        mat = fitz.Matrix(2.5, 2.5)  # higher zoom for small sub-labels
        pix = page.get_pixmap(matrix=mat)
        return pix.tobytes('png'), 'png'

    elif 'word' in content_type or 'docx' in content_type or content_type in [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]:
        from docx import Document
        doc = Document(BytesIO(file_bytes))
        text = '\n'.join([p.text for p in doc.paragraphs if p.text.strip()])
        return text, 'text'

    ext = content_type.split('/')[-1] if '/' in content_type else 'png'
    return file_bytes, ext


def _parse_time_24h(value):
    """Parse HH:MM or HH:MM:SS to datetime.time."""
    value = str(value).strip()
    for fmt in ('%H:%M:%S', '%H:%M'):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    raise ValueError(f'Invalid time: {value}')


def _format_time_24h(dt):
    return dt.strftime('%H:%M')


def _duration_hours(start_str, end_str):
    start = _parse_time_24h(start_str)
    end = _parse_time_24h(end_str)
    delta = (end - start).total_seconds() / 3600
    if delta <= 0:
        delta += 24
    return delta


def _add_hours(start_str, hours):
    start = _parse_time_24h(start_str)
    end = start + timedelta(hours=hours)
    return _format_time_24h(end)


def _normalize_day(day):
    if not day:
        return 'Monday'
    key = day.strip().lower()
    return DAY_MAP.get(key, day.strip().title())


LABEL_KEYS = (
    'course_code', 'course_name', 'title', 'class_name',
    'subject', 'label', 'name', 'course',
)


def _extract_cell_label(entry):
    for key in LABEL_KEYS:
        value = entry.get(key)
        if value is not None and str(value).strip():
            return ' '.join(str(value).split())
    return ''


def _normalize_faculty_code(label):
    """Extract BERR#### / BERN#### when present."""
    upper = label.upper()
    match = re.search(r'\b(BERR|BERN)\s*(\d{4})\b', upper)
    if match:
        return f'{match.group(1)}{match.group(2)}'
    return None


def _make_course_code(label):
    """Stable course code for DB — faculty code or full cell title."""
    faculty = _normalize_faculty_code(label)
    if faculty:
        return faculty
    normalized = ' '.join(label.split())
    return normalized.upper()[:50]


def _fix_known_slot_errors(course_code, day, start, end):
    """Correct common misreads on UTeM aSc PDF timetables."""
    code = (course_code or '').upper()
    start_h = int(start.split(':')[0])

    # Afternoon labs often misread as 12:00–3:00 instead of 14:00–17:00
    if any(k in code for k in ('PSM', '3151', 'PD', 'IDP', 'MENG', 'PROJECT')) and 11 <= start_h <= 13:
        duration = max(_duration_hours(start, end), 3)
        return '14:00', _add_hours('14:00', int(duration))

    # Friday BERR3133 BK5: box starts at 10:00 column, not 9:00
    if day == 'Friday' and '3133' in code and start == '09:00':
        return '10:00', _add_hours('10:00', 2)

    return start, end


def _expected_duration_hours(course_code, columns_spanned=None):
    """Most UTeM lecture blocks are 2h; labs/PSM/project blocks are 3h."""
    code = (course_code or '').upper()
    if any(k in code for k in ('PSM', '3151', 'PD /', 'PD/', 'MENG', 'IDP', 'PROJECT')):
        if columns_spanned and 2 <= columns_spanned <= 4:
            return columns_spanned
        return 3
    if columns_spanned == 2:
        return 2
    return 2


def normalize_timetable_entries(entries):
    """
    Fix common vision mistakes on UTeM aSc timetables:
    - 1h duration when box spans 2 columns
    - 4h duration when model jumped across large header labels
    - Prefer columns_spanned when provided
    """
    normalized = []

    for entry in entries:
        start = entry.get('start_time', '').strip()
        end = entry.get('end_time', '').strip()
        if not start or not end:
            continue

        # Normalize HH:MM (drop seconds if present)
        start = _format_time_24h(_parse_time_24h(start))
        end = _format_time_24h(_parse_time_24h(end))

        spans = entry.get('columns_spanned')
        if spans is not None:
            try:
                spans = int(spans)
                if 1 <= spans <= 6:
                    end = _add_hours(start, spans)
            except (TypeError, ValueError):
                spans = None

        label = _extract_cell_label(entry)
        if not label:
            continue

        course_name = (entry.get('course_name') or entry.get('title') or label).strip()
        course_name = ' '.join(course_name.split())
        course_code = _make_course_code(course_name)
        expected = _expected_duration_hours(course_code, spans)
        duration = _duration_hours(start, end)

        if spans is None:
            if duration == 1:
                duration = expected
                end = _add_hours(start, expected)
            elif duration == 4:
                # Jumped across large header labels — almost always 2-hour class
                duration = min(expected, 2)
                end = _add_hours(start, duration)
            elif duration > 4:
                duration = expected
                end = _add_hours(start, expected)
            elif abs(duration - expected) >= 1:
                duration = expected
                end = _add_hours(start, expected)
        elif abs(duration - expected) >= 0.5:
            duration = expected
            end = _add_hours(start, expected)

        day = _normalize_day(entry.get('day', ''))
        start, end = _fix_known_slot_errors(course_code, day, start, end)

        normalized.append({
            'course_code': course_code,
            'course_name': course_name,
            'day': day,
            'start_time': start,
            'end_time': end,
            'room': (entry.get('room') or '').strip(),
        })

    return normalized


def _call_groq(prompt, converted, file_type):
    if file_type == 'text':
        response = client.chat.completions.create(
            model='meta-llama/llama-4-scout-17b-16e-instruct',
            messages=[{
                'role': 'user',
                'content': f'{prompt}\n\nTimetable content:\n{converted}',
            }],
            max_tokens=3000,
        )
    else:
        image_base64 = base64.b64encode(converted).decode('utf-8')
        response = client.chat.completions.create(
            model='meta-llama/llama-4-scout-17b-16e-instruct',
            messages=[{
                'role': 'user',
                'content': [
                    {
                        'type': 'image_url',
                        'image_url': {
                            'url': f'data:image/{file_type};base64,{image_base64}',
                        },
                    },
                    {'type': 'text', 'text': prompt},
                ],
            }],
            max_tokens=3000,
        )
    return response.choices[0].message.content.strip()


def _parse_json_array(raw):
    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not match:
        raise ValueError(f'No JSON array found in response: {raw}')

    cleaned = match.group(0)
    cleaned = re.sub(
        r'"(start_time|end_time|room|course_code|day|columns_spanned)"\s*,\s*"(\d)',
        r'"\1":"\2',
        cleaned,
    )

    objects = re.findall(r'\{[^{}]+\}', cleaned)
    valid = []
    for obj in objects:
        try:
            parsed = json.loads(obj)
            has_label = any(parsed.get(k) for k in LABEL_KEYS)
            if parsed.get('start_time') and parsed.get('end_time') and has_label:
                valid.append(parsed)
        except json.JSONDecodeError:
            continue

    if not valid:
        return json.loads(cleaned)
    return valid


def parse_timetable_image(file_bytes, content_type='image/png'):
    converted, file_type = convert_to_image_bytes(file_bytes, content_type)
    raw = _call_groq(TIMETABLE_PROMPT, converted, file_type)
    print('GROQ RAW RESPONSE:', raw)

    entries = _parse_json_array(raw)
    entries = normalize_timetable_entries(entries)
    print('NORMALIZED TIMETABLE:', json.dumps(entries, indent=2))
    return entries
