from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from attendance.models import Course, StudentProfile
from .models import Alert
from .serializers import AlertSerializer
from .engine import check_and_trigger_alerts, send_alert_to_student


def _lecturer_alert_queryset(user):
    courses = Course.objects.filter(lecturer=user)
    return Alert.objects.filter(course__in=courses).select_related('course')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alert_list(request):
    if request.user.role != 'lecturer':
        return Response({'error': 'Lecturers only'}, status=status.HTTP_403_FORBIDDEN)

    alerts = _lecturer_alert_queryset(request.user)
    pending = request.query_params.get('pending')
    if pending == 'true':
        alerts = alerts.filter(is_sent=False)
    elif pending == 'false':
        alerts = alerts.filter(is_sent=True)

    return Response(AlertSerializer(alerts, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alert_detail(request, alert_id):
    if request.user.role != 'lecturer':
        return Response({'error': 'Lecturers only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        alert = _lecturer_alert_queryset(request.user).get(id=alert_id)
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

    return Response(AlertSerializer(alert).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def alert_send(request, alert_id):
    """Lecturer approves and sends the alert email to the student."""
    if request.user.role != 'lecturer':
        return Response({'error': 'Lecturers only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        alert = _lecturer_alert_queryset(request.user).get(id=alert_id)
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

    if alert.is_sent:
        return Response({'error': 'This alert was already sent to the student.'}, status=status.HTTP_400_BAD_REQUEST)

    if not alert.student_email:
        return Response(
            {'error': 'No student email on file. Re-upload the student list with email addresses.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    ok, err = send_alert_to_student(alert)
    if not ok:
        return Response({'error': err or 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    alert.is_sent = True
    alert.save(update_fields=['is_sent'])

    return Response({
        'message': f'Alert email sent to {alert.student_email}',
        'alert': AlertSerializer(alert).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_alert_check(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

    triggered = []
    profiles = StudentProfile.objects.filter(course=course)

    for profile in profiles:
        before = Alert.objects.filter(
            course=course,
            matric_number=profile.matric_number,
            is_sent=False,
        ).count()
        check_and_trigger_alerts(profile.matric_number, course)
        after = Alert.objects.filter(
            course=course,
            matric_number=profile.matric_number,
            is_sent=False,
        ).count()
        if after > before:
            triggered.append(profile.matric_number)

    return Response({
        'message': f'Alert scan complete. {len(triggered)} new alert(s) pending your review.',
        'triggered_for': triggered,
    })
