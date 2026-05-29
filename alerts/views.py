from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from attendance.models import Course, StudentProfile
from .models import Alert
from .serializers import AlertSerializer
from .engine import (
    check_and_trigger_alerts,
    excuse_session,
    refresh_student_alerts,
    send_alert_to_student,
)


def _lecturer_alert_queryset(user):
    courses = Course.objects.filter(lecturer=user)
    return Alert.objects.filter(course__in=courses).select_related('course').prefetch_related(
        'excuses',
        'excuses__session',
    )


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

    return Response(AlertSerializer(alerts, many=True, context={'request': request}).data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def alert_detail(request, alert_id):
    if request.user.role != 'lecturer':
        return Response({'error': 'Lecturers only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        alert = _lecturer_alert_queryset(request.user).get(id=alert_id)
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PATCH':
        if alert.is_sent:
            return Response({'error': 'Cannot edit a sent alert.'}, status=status.HTTP_400_BAD_REQUEST)
        message = request.data.get('lecturer_message', '')
        alert.lecturer_message = message if message is not None else ''
        alert.save(update_fields=['lecturer_message'])
        return Response(AlertSerializer(alert, context={'request': request}).data)

    return Response(AlertSerializer(alert, context={'request': request}).data)


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

    if 'lecturer_message' in request.data:
        alert.lecturer_message = request.data.get('lecturer_message') or ''
        alert.save(update_fields=['lecturer_message'])

    ok, err = send_alert_to_student(alert)
    if not ok:
        return Response({'error': err or 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    alert.is_sent = True
    alert.save(update_fields=['is_sent'])

    return Response({
        'message': f'Alert email sent to {alert.student_email}',
        'alert': AlertSerializer(alert, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def alert_excuse_session(request, alert_id):
    """Upload proof (MC, note, PDF/image) and excuse one missed class."""
    if request.user.role != 'lecturer':
        return Response({'error': 'Lecturers only'}, status=status.HTTP_403_FORBIDDEN)

    try:
        alert = _lecturer_alert_queryset(request.user).get(id=alert_id)
    except Alert.DoesNotExist:
        return Response({'error': 'Alert not found'}, status=status.HTTP_404_NOT_FOUND)

    if alert.is_sent:
        return Response(
            {'error': 'Cannot excuse sessions on an alert that was already emailed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session_id = int(session_id)
    except (TypeError, ValueError):
        return Response({'error': 'Invalid session_id'}, status=status.HTTP_400_BAD_REQUEST)

    reason_type = request.data.get('reason_type', '').strip()
    reason_note = request.data.get('reason_note', '')
    proof_file = request.FILES.get('proof')

    ok, err = excuse_session(
        session_id=session_id,
        matric_number=alert.matric_number,
        course=alert.course,
        proof_file=proof_file,
        reason_type=reason_type,
        reason_note=reason_note,
        alert=alert,
        lecturer=request.user,
    )
    if not ok:
        return Response({'error': err}, status=status.HTTP_400_BAD_REQUEST)

    alert_id_saved = alert.id
    try:
        alert = _lecturer_alert_queryset(request.user).get(id=alert_id_saved)
        alert_data = AlertSerializer(alert, context={'request': request}).data
        alert_revoked = False
    except Alert.DoesNotExist:
        alert_data = None
        alert_revoked = True

    return Response({
        'message': (
            'Absence excused. Pending warning/bar alert updated or removed for this student.'
            if alert_revoked
            else 'Absence excused. Alert updated.'
        ),
        'alert_revoked': alert_revoked,
        'alert': alert_data,
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
        refresh_student_alerts(profile.matric_number, course)
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
