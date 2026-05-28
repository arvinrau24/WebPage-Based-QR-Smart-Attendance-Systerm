from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings
from attendance.models import AttendanceRecord, Session, Course, StudentProfile
from .models import Alert


def send_alert_email(lecturer_email, alert_type, student_name, matric, section, course_code, detail, student_email=None):
    if alert_type == 'warning':
        subject = f"[ATTENDANCE WARNING] {course_code} — {matric}"
        body = f"""Dear {student_name},

This is an automated attendance alert from the Smart Attendance System (UTeM).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ATTENDANCE WARNING NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course     : {course_code}
Section    : Seksyen {section}
Student    : {student_name}
Matric No  : {matric}
Issue      : {detail}

Please ensure your attendance improves to avoid being barred from the final examination.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Attendance System — UTeM
This is an automated message. Please do not reply.
"""
    else:
        subject = f"[ATTENDANCE BAR] {course_code} — {matric}"
        body = f"""Dear {student_name},

This is an automated attendance alert from the Smart Attendance System (UTeM).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫  ATTENDANCE BAR NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course     : {course_code}
Section    : Seksyen {section}
Student    : {student_name}
Matric No  : {matric}
Issue      : {detail}

You are at risk of being barred from the final examination.
Please contact your lecturer immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Attendance System — UTeM
This is an automated message. Please do not reply.
"""

    recipients = []
    if student_email:
        recipients.append(student_email)
    if lecturer_email:
        recipients.append(lecturer_email)

    if not recipients:
        return False

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email='smartattendance.utem@gmail.com',
            recipient_list=recipients,
            fail_silently=False,
        )
        print(f"Alert email sent to {recipients}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False