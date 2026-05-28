from django.core.mail import send_mail
from django.utils import timezone
from attendance.models import AttendanceRecord, Session, StudentProfile
from .models import Alert

SYSTEM_EMAIL = 'smartattendance.utem@gmail.com'
ATTENDANCE_THRESHOLD = 80
MIN_SESSIONS_FOR_BAR = 3
MIN_CONSECUTIVE_FOR_WARNING = 3


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
    Sessions that have actually run (finalized) up to today.
    Future timetable slots and unfinalized classes are excluded.
    """
    today = timezone.localdate()
    return Session.objects.filter(
        course=course,
        is_finalized=True,
        date__lte=today,
    )


def _get_consecutive_missed_sessions(student_matric, course):
    sessions = _completed_sessions(course).order_by('-date')
    missed = []
    for session in sessions:
        record = AttendanceRecord.objects.filter(
            session=session,
            matric_number=student_matric,
        ).first()
        if not record or record.status == 'absent':
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
        if not record or record.status == 'absent':
            missed.append(_session_payload(session))
    return missed


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
    completed = _completed_sessions(course)
    total_sessions = completed.count()

    # No finalized classes yet (e.g. semester starts today) — do not bar
    if total_sessions < MIN_SESSIONS_FOR_BAR:
        return

    present_count = AttendanceRecord.objects.filter(
        session__in=completed,
        matric_number=student_matric,
        status='present',
    ).count()

    attendance_percentage = (present_count / total_sessions) * 100

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
