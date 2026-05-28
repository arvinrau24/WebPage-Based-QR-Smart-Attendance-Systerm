from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Alert
from .serializers import AlertSerializer
from attendance.models import Course, Session, AttendanceRecord
from django.contrib.auth import get_user_model
from .engine import check_and_trigger_alerts
from attendance.models import Course, Session, AttendanceRecord, StudentProfile

User = get_user_model()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alert_list(request):
    """Lecturer sees all alerts for their courses."""
    if request.user.role == 'lecturer':
        courses = Course.objects.filter(lecturer=request.user)
        alerts = Alert.objects.filter(course__in=courses).order_by('-triggered_at')
    else:
        alerts = Alert.objects.filter(student=request.user).order_by('-triggered_at')

    return Response(AlertSerializer(alerts, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def run_alert_check(request, course_id):
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    # Get lecturer email
    lecturer_email = request.user.email
    if not lecturer_email:
        return Response({'error': 'Lecturer email not set'}, status=400)

    # Check all enrolled students
    profiles = StudentProfile.objects.filter(course=course)
    triggered = []

    for profile in profiles:
        before = Alert.objects.filter(course=course, notes__icontains=profile.matric_number).count()
        check_and_trigger_alerts(profile.matric_number, course, lecturer_email)
        after = Alert.objects.filter(course=course, notes__icontains=profile.matric_number).count()
        if after > before:
            triggered.append(profile.matric_number)

    return Response({
        'message': f'Alert check complete. {len(triggered)} new alerts triggered.',
        'triggered_for': triggered
    })