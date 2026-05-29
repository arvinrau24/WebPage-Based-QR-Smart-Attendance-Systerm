from rest_framework import serializers
from .models import Alert, AlertSessionExcuse


class AlertExcuseSerializer(serializers.ModelSerializer):
    session_date = serializers.DateField(source='session.date', read_only=True)
    start_time = serializers.TimeField(source='session.start_time', read_only=True)
    end_time = serializers.TimeField(source='session.end_time', read_only=True)
    reason_label = serializers.SerializerMethodField()
    proof_url = serializers.SerializerMethodField()

    class Meta:
        model = AlertSessionExcuse
        fields = [
            'id',
            'session',
            'session_date',
            'start_time',
            'end_time',
            'matric_number',
            'reason_type',
            'reason_label',
            'reason_note',
            'proof_url',
            'created_at',
        ]

    def get_reason_label(self, obj):
        return obj.get_reason_type_display()

    def get_proof_url(self, obj):
        request = self.context.get('request')
        if not obj.proof_file:
            return None
        url = obj.proof_file.url
        if request:
            return request.build_absolute_uri(url)
        return url


class AlertSerializer(serializers.ModelSerializer):
    course_code = serializers.CharField(source='course.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    reason_label = serializers.SerializerMethodField()
    excuses = AlertExcuseSerializer(many=True, read_only=True)

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
            'excuses',
            'lecturer_message',
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
