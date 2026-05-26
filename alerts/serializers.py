from rest_framework import serializers
from .models import Alert

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ['id', 'student', 'course', 'alert_type', 'triggered_at', 'is_sent', 'notes']