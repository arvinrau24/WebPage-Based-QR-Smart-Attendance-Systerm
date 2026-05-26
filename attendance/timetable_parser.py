import os
import json
import base64
import re
from io import BytesIO
from groq import Groq

client = Groq(api_key=os.getenv('GROQ_API_KEY'))

def convert_to_image_bytes(file_bytes, content_type):
    """Convert PDF or DOCX to PNG image bytes for Groq vision."""

    if 'pdf' in content_type:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=file_bytes, filetype='pdf')
        page = doc[0]  # First page
        mat = fitz.Matrix(2, 2)  # 2x zoom for clarity
        pix = page.get_pixmap(matrix=mat)
        return pix.tobytes('png'), 'png'

    elif 'word' in content_type or 'docx' in content_type or content_type in [
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ]:
        # Convert DOCX to PDF first using python-docx text extraction
        # Then send as text prompt instead
        from docx import Document
        doc = Document(BytesIO(file_bytes))
        text = '\n'.join([p.text for p in doc.paragraphs if p.text.strip()])
        return text, 'text'

    else:
        # Assume image
        ext = content_type.split('/')[-1] if '/' in content_type else 'png'
        return file_bytes, ext


def parse_timetable_image(file_bytes, content_type='image/png'):
    prompt = """
Analyze this university timetable.
Extract ALL course entries you can see.

For each entry return:
- course_code (e.g. BERR4713)
- day (Monday/Tuesday/Wednesday/Thursday/Friday)
- start_time (24hr format HH:MM)
- end_time (24hr format HH:MM)
- room (e.g. BK8)

Return ONLY a valid JSON array, no extra text, no markdown, no backticks.
Example:
[{"course_code":"BERR4713","day":"Monday","start_time":"11:00","end_time":"12:00","room":"BK8"}]
"""

    converted, file_type = convert_to_image_bytes(file_bytes, content_type)

    # If DOCX was converted to text, use text prompt instead of vision
    if file_type == 'text':
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": f"{prompt}\n\nTimetable content:\n{converted}"
                }
            ],
            max_tokens=2000,
        )
    else:
        image_base64 = base64.b64encode(converted).decode('utf-8')
        response = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{file_type};base64,{image_base64}"
                            }
                        },
                        {"type": "text", "text": prompt}
                    ]
                }
            ],
            max_tokens=2000,
        )

    raw = response.choices[0].message.content.strip()
    print("GROQ RAW RESPONSE:", raw)

    match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON array found in response: {raw}")

    cleaned = match.group(0)
    cleaned = re.sub(r'"(start_time|end_time|room|course_code|day)"\s*,\s*"(\d)', r'"\1":"\2', cleaned)

    objects = re.findall(r'\{[^{}]+\}', cleaned)
    valid_objects = []
    for obj in objects:
        try:
            parsed = json.loads(obj)
            if parsed.get('start_time') and parsed.get('end_time'):
                valid_objects.append(obj)
        except:
            continue

    final = '[' + ','.join(valid_objects) + ']'
    return json.loads(final)