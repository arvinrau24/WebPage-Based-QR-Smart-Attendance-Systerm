from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings
from attendance.models import AttendanceRecord, Session, Course, StudentProfile
from .models import Alert


def send_alert_email(lecturer_email, alert_type, student_name, matric, section, course_code, detail):
    if alert_type == 'warning':
        subject = f"[ATTENDANCE WARNING] Student at risk — {course_code} (Seksyen {section})"
        body = f"""Dear Lecturer,

This is an automated attendance alert from the Smart Attendance System.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  ATTENDANCE WARNING NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course     : {course_code}
Section    : Seksyen {section}
Student    : {student_name}
Matric No  : {matric}
Issue      : {detail}

Please follow up with this student at your earliest convenience.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Attendance System — UTeM
This is an automated message. Please do not reply.
"""
    else:
        subject = f"[ATTENDANCE BAR] Student below 80% — {course_code} (Seksyen {section})"
        body = f"""Dear Lecturer,

This is an automated attendance alert from the Smart Attendance System.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚫  ATTENDANCE BAR NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Course     : {course_code}
Section    : Seksyen {section}
Student    : {student_name}
Matric No  : {matric}
Issue      : {detail}

This student is at risk of being barred from the final examination.
Please take immediate action.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Smart Attendance System — UTeM
This is an automated message. Please do not reply.
"""

    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[lecturer_email],
            fail_silently=False,
        )
        print(f"Alert email sent to {lecturer_email}")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


def check_and_trigger_alerts(student_matric, course, lecturer_email):
    trigger_consecutive_absence_alert(student_matric, course, lecturer_email)
    trigger_below_threshold_alert(student_matric, course, lecturer_email)


def trigger_consecutive_absence_alert(student_matric, course, lecturer_email):
    sessions = Session.objects.filter(course=course).order_by('-date')
    consecutive = 0

    for session in sessions:
        record = AttendanceRecord.objects.filter(
            session=session,
            matric_number=student_matric
        ).first()

        if not record or record.status == 'absent':
            consecutive += 1
        else:
            break

        if consecutive >= 3:
            already_exists = Alert.objects.filter(
                course=course,
                alert_type='warning',
                notes__icontains=student_matric
            ).exists()

            if not already_exists:
                # Get student profile for section
                profile = StudentProfile.objects.filter(
                    course=course,
                    matric_number=student_matric
                ).first()

                section = profile.section if profile else 'N/A'
                student_name = profile.full_name if profile else student_matric

                Alert.objects.create(
                    course=course,
                    alert_type='warning',
                    notes=f'{student_name} ({student_matric}) | Seksyen {section} | {consecutive} consecutive absences.'
                )

                send_alert_email(
                    lecturer_email=lecturer_email,
                    alert_type='warning',
                    student_name=student_name,
                    matric=student_matric,
                    section=section,
                    course_code=course.code,
                    detail=f'Student has missed {consecutive} consecutive classes.'
                )
            break


def trigger_below_threshold_alert(student_matric, course, lecturer_email):
    total_sessions = Session.objects.filter(course=course).count()
    if total_sessions == 0:
        return

    present_count = AttendanceRecord.objects.filter(
        session__course=course,
        matric_number=student_matric,
        status='present'
    ).count()

    attendance_percentage = (present_count / total_sessions) * 100

    if attendance_percentage < 80:
        already_exists = Alert.objects.filter(
            course=course,
            alert_type='bar',
            notes__icontains=student_matric
        ).exists()

        if not already_exists:
            profile = StudentProfile.objects.filter(
                course=course,
                matric_number=student_matric
            ).first()

            section = profile.section if profile else 'N/A'
            student_name = profile.full_name if profile else student_matric

            Alert.objects.create(
                course=course,
                alert_type='bar',
                notes=f'{student_name} ({student_matric}) | Seksyen {section} | Attendance {attendance_percentage:.1f}% (below 80%).'
            )

            send_alert_email(
                lecturer_email=lecturer_email,
                alert_type='bar',
                student_name=student_name,
                matric=student_matric,
                section=section,
                course_code=course.code,
                detail=f'Attendance is {attendance_percentage:.1f}% (below required 80%).'
            )