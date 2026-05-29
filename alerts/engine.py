import os

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from attendance.models import AttendanceRecord, Session, StudentProfile
from .models import Alert, AlertSessionExcuse

SYSTEM_EMAIL = 'smartattendance.utem@gmail.com'
ATTENDANCE_THRESHOLD = 80
MIN_SESSIONS_FOR_BAR = 3
MIN_CONSECUTIVE_FOR_WARNING = 3
ATTENDED_STATUSES = ('present', 'excused')


def _session_payload(session):
    return {
        'session_id': session.id,
        'date': session.date.isoformat(),
        'start_time': session.start_time.strftime('%H:%M'),
        'end_time': session.end_time.strftime('%H:%M'),
    }


def _get_profile(course, student_matric):
    return StudentProfile.objects.filter(
        course=course,
        matric_number=student_matric,
    ).first()


def _completed_sessions(course):
    """
    Finalized sessions up to today, limited to the course semester window
    (set when the lecturer uploads a timetable with a start date).
    """
    today = timezone.localdate()
    qs = Session.objects.filter(
        course=course,
        is_finalized=True,
        date__lte=today,
    )
    if course.semester_start:
        qs = qs.filter(date__gte=course.semester_start)
    if course.semester_end:
        qs = qs.filter(date__lte=course.semester_end)
    return qs


def _get_consecutive_missed_sessions(student_matric, course):
    sessions = _completed_sessions(course).order_by('-date')
    missed = []
    for session in sessions:
        record = AttendanceRecord.objects.filter(
            session=session,
            matric_number=student_matric,
        ).first()
        if not record or record.status not in ATTENDED_STATUSES:
            missed.append(_session_payload(session))
        else:
            break
    return missed


def _get_all_missed_sessions(student_matric, course):
    sessions = _completed_sessions(course).order_by('date')
    missed = []
    for session in sessions:
        record = AttendanceRecord.objects.filter(
            session=session,
            matric_number=student_matric,
        ).first()
        if not record or record.status not in ATTENDED_STATUSES:
            missed.append(_session_payload(session))
    return missed


def _attendance_percentage(student_matric, course):
    completed = _completed_sessions(course)
    total_sessions = completed.count()
    if total_sessions == 0:
        return 0.0, 0
    present_count = AttendanceRecord.objects.filter(
        session__in=completed,
        matric_number=student_matric,
        status__in=ATTENDED_STATUSES,
    ).count()
    return (present_count / total_sessions) * 100, total_sessions


def validate_excuse_proof(uploaded_file):
    if not uploaded_file:
        return 'Proof document is required (MC, note, PDF, or image).'
    ext = os.path.splitext(uploaded_file.name)[1].lower()
    if ext not in settings.ALERT_EXCUSE_ALLOWED_EXTENSIONS:
        return (
            'Invalid file type. Allowed: PDF, JPG, PNG, GIF, WEBP, DOC, DOCX.'
        )
    if uploaded_file.size > settings.ALERT_EXCUSE_MAX_BYTES:
        return 'File is too large (max 10 MB).'
    return None


def refresh_student_alerts(student_matric, course):
    """Update or remove pending alerts after an absence is excused."""
    pending = Alert.objects.filter(
        course=course,
        matric_number=student_matric,
        is_sent=False,
    )
    for alert in list(pending):
        if alert.reason == 'consecutive_absence':
            missed = _get_consecutive_missed_sessions(student_matric, course)
            if len(missed) < MIN_CONSECUTIVE_FOR_WARNING:
                alert.delete()
                continue
            alert.consecutive_count = len(missed)
            alert.missed_sessions = missed
            alert.save(update_fields=['consecutive_count', 'missed_sessions'])
        elif alert.reason == 'below_threshold':
            pct, total = _attendance_percentage(student_matric, course)
            if total < MIN_SESSIONS_FOR_BAR or pct >= ATTENDANCE_THRESHOLD:
                alert.delete()
                continue
            alert.attendance_percentage = round(pct, 1)
            alert.missed_sessions = _get_all_missed_sessions(student_matric, course)
            alert.save(update_fields=['attendance_percentage', 'missed_sessions'])


def excuse_session(
    *,
    session_id,
    matric_number,
    course,
    proof_file,
    reason_type,
    reason_note='',
    alert=None,
    lecturer=None,
):
    """Mark a missed class as excused and refresh pending warning/bar alerts."""
    err = validate_excuse_proof(proof_file)
    if err:
        return False, err

    valid_reasons = {c[0] for c in AlertSessionExcuse.REASON_TYPES}
    if reason_type not in valid_reasons:
        return False, 'Invalid excuse reason type.'

    try:
        session = Session.objects.get(id=session_id, course=course)
    except Session.DoesNotExist:
        return False, 'Session not found for this course.'

    if AlertSessionExcuse.objects.filter(
        session=session,
        matric_number=matric_number,
    ).exists():
        return False, 'This class was already excused with proof on file.'

    record = AttendanceRecord.objects.filter(
        session=session,
        matric_number=matric_number,
    ).first()

    if record and record.status in ATTENDED_STATUSES:
        return False, 'Student is already marked present or excused for this class.'

    profile = _get_profile(course, matric_number)
    if record:
        record.status = 'excused'
        record.save(update_fields=['status'])
    else:
        AttendanceRecord.objects.create(
            session=session,
            matric_number=matric_number,
            full_name=profile.full_name if profile else '',
            status='excused',
        )

    AlertSessionExcuse.objects.create(
        alert=alert,
        course=course,
        session=session,
        matric_number=matric_number,
        reason_type=reason_type,
        reason_note=(reason_note or '').strip(),
        proof_file=proof_file,
        uploaded_by=lecturer,
    )

    refresh_student_alerts(matric_number, course)
    return True, None


def send_alert_to_student(alert):
    """Send alert email to the student only (after lecturer review)."""
    if not alert.student_email:
        return False, 'No student email on file. Add email in the student list upload.'

    course = alert.course
    section = 'N/A'
    profile = _get_profile(course, alert.matric_number)
    if profile and profile.section:
        section = profile.section

    if alert.reason == 'consecutive_absence':
        detail = (
            f'You have missed {alert.consecutive_count} consecutive class(es) '
            f'for {course.code} ({course.name}).'
        )
    else:
        detail = (
            f'Your attendance for {course.code} ({course.name}) is '
            f'{alert.attendance_percentage:.1f}% based on completed classes so far '
            f'(below the required {ATTENDANCE_THRESHOLD}%).'
        )

    if alert.alert_type == 'warning':
        subject = f"[ATTENDANCE WARNING] {course.code} — {alert.matric_number}"
        body = f"""Dear {alert.student_name},

This is an automated attendance alert from the Smart Attendance System (UTeM).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ATTENDANCE WARNING NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course     : {course.code} — {course.name}
Section    : Seksyen {section}
Student    : {alert.student_name}
Matric No  : {alert.matric_number}
Issue      : {detail}

Please ensure your attendance improves to avoid being barred from the final examination.
"""
        if alert.lecturer_message and alert.lecturer_message.strip():
            body += f"""
Additional message from your lecturer:
{alert.lecturer_message.strip()}
"""
        body += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Attendance System — UTeM
This is an automated message. Please do not reply.
"""
    else:
        subject = f"[ATTENDANCE BAR] {course.code} — {alert.matric_number}"
        body = f"""Dear {alert.student_name},

This is an automated attendance alert from the Smart Attendance System (UTeM).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫  ATTENDANCE BAR NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course     : {course.code} — {course.name}
Section    : Seksyen {section}
Student    : {alert.student_name}
Matric No  : {alert.matric_number}
Issue      : {detail}

You are at risk of being barred from the final examination.
Please contact your lecturer immediately.
"""
        if alert.lecturer_message and alert.lecturer_message.strip():
            body += f"""
Additional message from your lecturer:
{alert.lecturer_message.strip()}
"""
        body += """
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Attendance System — UTeM
This is an automated message. Please do not reply.
"""

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=SYSTEM_EMAIL,
            recipient_list=[alert.student_email],
            fail_silently=False,
        )
        return True, None
    except Exception as exc:
        return False, str(exc)


def check_and_trigger_alerts(student_matric, course):
    """Create pending alerts for lecturer review (no email sent yet)."""
    trigger_consecutive_absence_alert(student_matric, course)
    trigger_below_threshold_alert(student_matric, course)


def trigger_consecutive_absence_alert(student_matric, course):
    missed_sessions = _get_consecutive_missed_sessions(student_matric, course)
    consecutive = len(missed_sessions)

    if consecutive < MIN_CONSECUTIVE_FOR_WARNING:
        return

    already_exists = Alert.objects.filter(
        course=course,
        alert_type='warning',
        matric_number=student_matric,
        is_sent=False,
    ).exists() or Alert.objects.filter(
        course=course,
        alert_type='warning',
        matric_number=student_matric,
        reason='consecutive_absence',
        is_sent=True,
    ).exists()

    if already_exists:
        return

    profile = _get_profile(course, student_matric)
    student_name = profile.full_name if profile else student_matric
    student_email = profile.email if profile else ''
    section = profile.section if profile else 'N/A'

    Alert.objects.create(
        course=course,
        alert_type='warning',
        matric_number=student_matric,
        student_name=student_name,
        student_email=student_email,
        reason='consecutive_absence',
        consecutive_count=consecutive,
        missed_sessions=missed_sessions,
        notes=(
            f'{student_name} ({student_matric}) | Seksyen {section} | '
            f'{consecutive} consecutive absences — pending review.'
        ),
    )


def trigger_below_threshold_alert(student_matric, course):
    # Bar letters use the semester window from timetable upload (7+holiday+7 weeks).
    if not course.semester_start or not course.semester_end:
        return

    completed = _completed_sessions(course)
    total_sessions = completed.count()

    # No finalized classes yet (e.g. semester starts today) — do not bar
    if total_sessions < MIN_SESSIONS_FOR_BAR:
        return

    attendance_percentage, _ = _attendance_percentage(student_matric, course)

    if attendance_percentage >= ATTENDANCE_THRESHOLD:
        return

    already_exists = Alert.objects.filter(
        course=course,
        alert_type='bar',
        matric_number=student_matric,
        is_sent=False,
    ).exists() or Alert.objects.filter(
        course=course,
        alert_type='bar',
        matric_number=student_matric,
        reason='below_threshold',
        is_sent=True,
    ).exists()

    if already_exists:
        return

    profile = _get_profile(course, student_matric)
    student_name = profile.full_name if profile else student_matric
    student_email = profile.email if profile else ''
    section = profile.section if profile else 'N/A'
    missed_sessions = _get_all_missed_sessions(student_matric, course)

    Alert.objects.create(
        course=course,
        alert_type='bar',
        matric_number=student_matric,
        student_name=student_name,
        student_email=student_email,
        reason='below_threshold',
        attendance_percentage=round(attendance_percentage, 1),
        missed_sessions=missed_sessions,
        notes=(
            f'{student_name} ({student_matric}) | Seksyen {section} | '
            f'Attendance {attendance_percentage:.1f}% over {total_sessions} class(es) '
            f'(below {ATTENDANCE_THRESHOLD}%) — pending review.'
        ),
    )
