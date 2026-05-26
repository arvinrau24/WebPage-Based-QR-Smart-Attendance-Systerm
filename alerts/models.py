from django.db import models
from django.conf import settings
from attendance.models import Course

class Alert(models.Model):
    ALERT_TYPES = (
        ('warning', 'Warning Letter'),
        ('bar', 'Bar Letter'),
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alerts',
        null=True, blank=True
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=10, choices=ALERT_TYPES)
    triggered_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.alert_type.upper()} - {self.course.code}"