from rest_framework import serializers
from .models import Alert


class AlertSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    reason_label = serializers.SerializerMethodField()

    class Meta:
        model = Alert
        fields = [
            'id',
            'course',
            'course_id',
            'course_code',
            'course_name',
            'alert_type',
            'matric_number',
            'student_name',
            'student_email',
            'reason',
            'reason_label',
            'attendance_percentage',
            'consecutive_count',
            'missed_sessions',
            'triggered_at',
            'is_sent',
            'notes',
        ]

    def get_reason_label(self, obj):
        if obj.reason == 'consecutive_absence':
            return 'Consecutive absences'
        if obj.reason == 'below_threshold':
            return 'Below 80% attendance'
        return obj.reason or ''
