from rest_framework import serializers
from .models import Course, Session, QRToken, AttendanceRecord

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'section', 'lecturer', 'students',
            'semester_start', 'semester_end',
        ]
        read_only_fields = ['lecturer']


class SessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Session
        fields = ['id', 'course', 'date', 'start_time', 'end_time', 'created_at', 'is_finalized']
        read_only_fields = ['course', 'created_at']


class QRTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRToken
        fields = ['id', 'session', 'token', 'created_at', 'expires_at', 'is_active']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = [
            'id', 'session', 'student', 'full_name', 'matric_number',
            'status', 'scanned_at', 'latitude', 'longitude', 'gps_verified'
        ]