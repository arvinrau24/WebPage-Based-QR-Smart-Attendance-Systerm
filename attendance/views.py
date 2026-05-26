from multiprocessing.managers import Token
from tkinter.font import Font
from tkinter.font import Font

import openpyxl
import openpyxl
from django.http import HttpResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import qrcode
import uuid
import io
import base64
import os

import datetime

from .models import Course, Session, QRToken, AttendanceRecord
from .serializers import CourseSerializer, SessionSerializer, QRTokenSerializer, AttendanceRecordSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes

from .timetable_parser import parse_timetable_image
from django.contrib.auth import get_user_model

from alerts.models import Alert

User = get_user_model()

# --- COURSES ---
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def course_list(request):
    if request.method == 'GET':
        if request.user.role == 'lecturer':
            courses = Course.objects.filter(lecturer=request.user)
        else:
            courses = request.user.enrolled_courses.all()
        return Response(CourseSerializer(courses, many=True).data)

    if request.method == 'POST':
        serializer = CourseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(lecturer=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# == STUDENT ENROLLMENT ==
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_student_manual(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    matric_number = request.data.get('matric_number', '').strip()
    full_name = request.data.get('full_name', '').strip()
    phone = request.data.get('phone', '').strip()
    email = request.data.get('email', '').strip()

    if not matric_number or not full_name:
        return Response({'error': 'Matric number and full name are required'}, status=400)

    if StudentProfile.objects.filter(course=course, matric_number=matric_number).exists():
        return Response({'error': f'{matric_number} is already enrolled'}, status=400)

    student = StudentProfile.objects.create(
        course=course,
        matric_number=matric_number,
        full_name=full_name,
        phone=phone,
        email=email,
        section='',
    )

    return Response({
        'message': f'Student {matric_number} added successfully',
        'student': {
            'id': student.id,
            'matric_number': student.matric_number,
            'full_name': student.full_name,
            'phone': student.phone,
            'email': student.email,
        }
    }, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enrolled_students(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    students = StudentProfile.objects.filter(course=course).order_by('section', 'full_name')
    student_list = [{
        'id': s.id,
        'matric_number': s.matric_number,
        'full_name': s.full_name,
        'phone': s.phone or '',
        'email': s.email or '',
        'section': s.section or '',
    } for s in students]

    return Response({
        'course': {'id': course.id, 'code': course.code, 'name': course.name, 'section': course.section},
        'students': student_list,
        'total': len(student_list)
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def remove_student_from_course(request, course_id, student_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
        student = StudentProfile.objects.get(id=student_id, course=course)
        student.delete()
        return Response({'message': f'Student {student.matric_number} removed from course'})
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)
    except StudentProfile.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_all_enrollments(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
        count = StudentProfile.objects.filter(course=course).count()
        StudentProfile.objects.filter(course=course).delete()
        return Response({'message': f'All enrollments cleared. {count} students removed.', 'removed_count': count})
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)




from django.db import transaction
# == COURSE MANAGEMENT ==
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course_manual(request):
    """Manually create a course"""
    try:
        code = request.data.get('code')
        name = request.data.get('name')
        section = request.data.get('section', '')
        
        if not code or not name:
            return Response({'error': 'Course code and name are required'}, status=400)
        
        # Check if course already exists for this lecturer
        if Course.objects.filter(code=code, lecturer=request.user).exists():
            return Response({'error': f'Course {code} already exists'}, status=400)
        
        course = Course.objects.create(
            code=code,
            name=name,
            section=section,
            lecturer=request.user
        )
        
        return Response({
            'message': 'Course created successfully',
            'course': {
                'id': course.id,
                'code': course.code,
                'name': course.name,
                'section': course.section,
            }
        }, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

# --- SESSIONS ---
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def session_list(request, course_id):
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    if request.method == 'GET':
        sessions = Session.objects.filter(course=course)
        return Response(SessionSerializer(sessions, many=True).data)

    if request.method == 'POST':
        serializer = SessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(course=course)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- QR CODE GENERATION ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_qr(request, session_id):
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    QRToken.objects.filter(session=session, is_active=True).update(is_active=False)

    token = uuid.uuid4()
    expires_at = timezone.now() + timedelta(seconds=180)  # 3 minutes validity
    QRToken.objects.create(
        session=session,
        token=token,
        expires_at=expires_at,
        is_active=True
    )

    # QR encodes a URL that students open on their phone
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    scan_url = f"{frontend_url}/scan?token={token}"

    qr = qrcode.make(scan_url)
    buffer = io.BytesIO()
    qr.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()

    return Response({
        'token': str(token),
        'scan_url': scan_url,
        'expires_at': expires_at,
        'qr_image': f'data:image/png;base64,{qr_base64}'
    })


# --- MARK ATTENDANCE ---
@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def mark_attendance(request):
    token_value = request.data.get('token')
    full_name = request.data.get('full_name', '').strip()
    matric_number = request.data.get('matric_number', '').strip().upper()
    latitude = request.data.get('latitude')
    longitude = request.data.get('longitude')

    if not full_name or not matric_number:
        return Response({'error': 'Full name and matric number are required'}, status=400)

    try:
        qr_token = QRToken.objects.get(token=token_value, is_active=True)
    except QRToken.DoesNotExist:
        return Response({'error': 'Invalid or expired QR code'}, status=400)

    if timezone.now() > qr_token.expires_at:
        qr_token.is_active = False
        qr_token.save()
        return Response({'error': 'QR code has expired. Please scan the latest code.'}, status=400)

    # GPS verification — UTeM FTKEK coordinates
    gps_verified = False
    if latitude and longitude:
        from math import radians, sin, cos, sqrt, atan2
        building_lat = 2.3132493083489556
        building_lng = 102.31827936415627
        R = 6371000  # Earth radius in meters

        lat1, lon1 = radians(building_lat), radians(building_lng)
        lat2, lon2 = radians(float(latitude)), radians(float(longitude))
        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        distance = R * 2 * atan2(sqrt(a), sqrt(1-a))

        gps_verified = distance <= 50  # 50 meter radius

    session = qr_token.session

    # Check if already marked
    if AttendanceRecord.objects.filter(session=session, matric_number=matric_number).exists():
        return Response({'message': 'Attendance already marked!'}, status=200)

    AttendanceRecord.objects.create(
        session=session,
        full_name=full_name,
        matric_number=matric_number,
        status='present',
        scanned_at=timezone.now(),
        latitude=float(latitude) if latitude else None,
        longitude=float(longitude) if longitude else None,
        gps_verified=gps_verified
    )

    if gps_verified:
        return Response({'message': f'Attendance marked successfully! ✅'}, status=201)
    else:
        return Response({'message': f'Attendance marked ⚠️ but GPS could not verify your location.'}, status=201)

# ---  live attendance view ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_attendance(request, session_id):
    records = AttendanceRecord.objects.filter(
        session_id=session_id
    ).order_by('scanned_at')
    return Response(AttendanceRecordSerializer(records, many=True).data)

# --- TIMETABLE UPLOAD ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_timetable(request):
    if 'image' not in request.FILES:
        return Response({'error': 'No image uploaded'}, status=400)

    # Get semester start date from request
    semester_start_str = request.data.get('semester_start')
    if not semester_start_str:
        return Response({'error': 'Semester start date is required'}, status=400)

    try:
        semester_start = datetime.date.fromisoformat(semester_start_str)
    except ValueError:
        return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)

    image_file = request.FILES['image']
    image_bytes = image_file.read()
    image_type = image_file.content_type.split('/')[-1]

    try:
        sessions_data = parse_timetable_image(image_bytes, image_file.content_type)
    except Exception as e:
        return Response({'error': f'Failed to parse timetable: {str(e)}'}, status=500)

    day_map = {
        'Monday': 0, 'Tuesday': 1, 'Wednesday': 2,
        'Thursday': 3, 'Friday': 4
    }

    created_count = 0
    TOTAL_WEEKS = 14

    for entry in sessions_data:
        print("PROCESSING ENTRY:", entry)
        try:
            course, _ = Course.objects.get_or_create(
                code=entry['course_code'],
                defaults={
                    'name': entry['course_code'],
                    'lecturer': request.user
                }
            )
            if course.lecturer != request.user:
                course.lecturer = request.user
                course.save()

            target_weekday = day_map.get(entry['day'], 0)
            days_ahead = (target_weekday - semester_start.weekday()) % 7
            first_session = semester_start + datetime.timedelta(days=days_ahead)

            for week in range(TOTAL_WEEKS):
                session_date = first_session + datetime.timedelta(weeks=week)
                session, created_new = Session.objects.get_or_create(
                    course=course,
                    date=session_date,
                    start_time=entry['start_time'] + ':00',
                    end_time=entry['end_time'] + ':00',
                )
                if created_new:
                    created_count += 1

        except Exception as e:
            print(f"ERROR on entry {entry}: {e}")
            continue
        if course.lecturer != request.user:
            course.lecturer = request.user
            course.save()

        target_weekday = day_map.get(entry['day'], 0)

        # Find first occurrence from semester start
        days_ahead = (target_weekday - semester_start.weekday()) % 7
        first_session = semester_start + datetime.timedelta(days=days_ahead)

        # Generate 14 weekly sessions
        for week in range(TOTAL_WEEKS):
            session_date = first_session + datetime.timedelta(weeks=week)
            session, created_new = Session.objects.get_or_create(
                course=course,
                date=session_date,
                start_time=entry['start_time'] + ':00',
                end_time=entry['end_time'] + ':00',
            )
            if created_new:
                created_count += 1

    return Response({
        'message': f'{created_count} sessions created across 14 weeks.',
    })

# --- DELETE COURSE ---
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_course(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
        course.delete()
        return Response({'message': 'Course deleted'})
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)


# --- DELETE SESSION ---
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_session(request, session_id):
    try:
        session = Session.objects.get(id=session_id)
        session.delete()
        return Response({'message': 'Session deleted'})
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)


# --- TODAY'S SESSIONS ---
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def todays_sessions(request):
    today = datetime.date.today()
    courses = Course.objects.filter(lecturer=request.user)
    sessions = Session.objects.filter(course__in=courses, date=today)
    return Response(SessionSerializer(sessions, many=True).data)

# --- EDIT COURSE ---
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_course(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    name = request.data.get('name', course.name)
    code = request.data.get('code', course.code)
    course.name = name
    course.code = code
    course.save()
    return Response(CourseSerializer(course).data)

# --- EXPORT ATTENDANCE TO EXCEL ---
from rest_framework.authtoken.models import Token
from django.http import HttpResponse
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def export_attendance_excel(request, session_id):
    # Authenticate via query param token
    token_key = request.GET.get('token')
    try:
        token = Token.objects.get(key=token_key)
        request.user = token.user
    except Token.DoesNotExist:
        return HttpResponse('Unauthorized', status=401)

    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return HttpResponse('Session not found', status=404)

    records = AttendanceRecord.objects.filter(
        session=session
    ).order_by('scanned_at')

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Attendance"

    ws.merge_cells('A1:F1')
    title_cell = ws['A1']
    title_cell.value = f"Attendance Report — {session.course.code} | {session.date} | {session.start_time} - {session.end_time}"
    title_cell.font = Font(bold=True, size=13)
    title_cell.alignment = Alignment(horizontal='center')

    headers = ['#', 'Full Name', 'Matric Number', 'Time Scanned', 'GPS Verified', 'Status']
    header_fill = PatternFill(start_color='4F46E5', end_color='4F46E5', fill_type='solid')
    header_font = Font(bold=True, color='FFFFFF')

    for col, header in enumerate(headers, start=1):
        cell = ws.cell(row=2, column=col, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal='center')

    for idx, record in enumerate(records, start=1):
        scanned_at = record.scanned_at.strftime('%I:%M:%S %p') if record.scanned_at else '-'
        gps = 'Verified ✓' if record.gps_verified else 'Unverified'
        row = [idx, record.full_name, record.matric_number, scanned_at, gps, record.status.capitalize()]

        for col, value in enumerate(row, start=1):
            cell = ws.cell(row=idx + 2, column=col, value=value)
            cell.alignment = Alignment(horizontal='center')
            if idx % 2 == 0:
                cell.fill = PatternFill(start_color='F3F4F6', end_color='F3F4F6', fill_type='solid')

    summary_row = len(records) + 4
    ws.cell(row=summary_row, column=1, value='Total Present:').font = Font(bold=True)
    ws.cell(row=summary_row, column=2, value=len(records)).font = Font(bold=True)

    ws.column_dimensions['A'].width = 5
    ws.column_dimensions['B'].width = 30
    ws.column_dimensions['C'].width = 20
    ws.column_dimensions['D'].width = 20
    ws.column_dimensions['E'].width = 15
    ws.column_dimensions['F'].width = 12

    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = f'attachment; filename=attendance_{session.course.code}_{session.date}.xlsx'
    wb.save(response)
    return response

from .student_list_parser import parse_student_list
from .models import Course, Session, QRToken, AttendanceRecord, StudentProfile
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_student_list(request, course_id):
    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    if 'file' not in request.FILES:
        return Response({'error': 'No file uploaded'}, status=400)

    file_bytes = request.FILES['file'].read()

    try:
        data = parse_student_list(file_bytes, request.FILES['file'].content_type)
    except Exception as e:
        return Response({'error': f'Failed to parse: {str(e)}'}, status=500)

    total_added = 0
    sections_found = []

    for entry in data:
        for student in entry['students']:
            _, created = StudentProfile.objects.update_or_create(
                course=course,
                matric_number=student['matric_number'],
                defaults={
                    'full_name': student['full_name'],
                    'phone': student['phone'],
                    'email': student['email'],
                    'section': entry['section'],
                }
            )
            if created:
                total_added += 1
        sections_found.append(f"Seksyen {entry['section']} — {len(entry['students'])} students")

    return Response({
        'message': f'{total_added} students enrolled in {course.code}.',
        'sections': sections_found
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_list(request, course_id):

    try:
        course = Course.objects.get(id=course_id, lecturer=request.user)
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=404)

    students = StudentProfile.objects.filter(course=course).order_by('section', 'full_name')
    data = [
        {
            'matric_number': s.matric_number,
            'full_name': s.full_name,
            'section': s.section,
            'email': s.email,
            'phone': s.phone,
        }
        for s in students
    ]
    return Response({'course': course.code, 'total': len(data), 'students': data})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def reset_semester(request):
    if not request.user.role == 'lecturer':
        return Response({'error': 'Unauthorized'}, status=403)

    courses = Course.objects.filter(lecturer=request.user)
    course_count = courses.count()

    # Delete everything cascade
    courses.delete()

    return Response({
        'message': f'Semester reset complete. {course_count} courses and all related sessions, attendance records and student profiles deleted.'
    })


from alerts.engine import check_and_trigger_alerts
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_session(request, session_id):
    try:
        session = Session.objects.get(id=session_id)
    except Session.DoesNotExist:
        return Response({'error': 'Session not found'}, status=404)

    course = session.course
    lecturer_email = request.user.email

    if not lecturer_email:
        return Response({'error': 'Lecturer email not set'}, status=400)

    # Get all enrolled students
    enrolled = StudentProfile.objects.filter(course=course)
    if not enrolled.exists():
        return Response({'error': 'No students enrolled in this course yet.'}, status=400)

    # Get students who already scanned (present)
    present_matrics = set(
        AttendanceRecord.objects.filter(
            session=session, status='present'
        ).values_list('matric_number', flat=True)
    )

    absent_count = 0
    present_count = len(present_matrics)

    # Mark absent for students who didn't scan
    for student in enrolled:
        if student.matric_number not in present_matrics:
            _, created = AttendanceRecord.objects.get_or_create(
                session=session,
                matric_number=student.matric_number,
                defaults={
                    'full_name': student.full_name,
                    'status': 'absent',
                    'scanned_at': None,
                    'gps_verified': False,
                }
            )
            if created:
                absent_count += 1

    # Run alert checks for all enrolled students
    alerts_triggered = []
    for student in enrolled:
        before = Alert.objects.filter(
            course=course,
            notes__icontains=student.matric_number
        ).count()

        check_and_trigger_alerts(student.matric_number, course, lecturer_email)

        after = Alert.objects.filter(
            course=course,
            notes__icontains=student.matric_number
        ).count()

        if after > before:
            alerts_triggered.append(student.matric_number)

    return Response({
        'message': f'Session finalized.',
        'present': present_count,
        'absent': absent_count,
        'total_enrolled': enrolled.count(),
        'alerts_triggered': len(alerts_triggered),
        'alerted_students': alerts_triggered
    })