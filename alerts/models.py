from django.db import models
from django.conf import settings
from attendance.models import Course


class Alert(models.Model):
    ALERT_TYPES = (
        ('warning', 'Warning Letter'),
        ('bar', 'Bar Letter'),
    )
    REASON_CHOICES = (
        ('consecutive_absence', 'Consecutive Absence'),
        ('below_threshold', 'Below Attendance Threshold'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alerts',
        null=True,
        blank=True,
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=10, choices=ALERT_TYPES)
    matric_number = models.CharField(max_length=20, blank=True)
    student_name = models.CharField(max_length=100, blank=True)
    student_email = models.EmailField(blank=True)
    reason = models.CharField(max_length=30, choices=REASON_CHOICES, blank=True)
    attendance_percentage = models.FloatField(null=True, blank=True)
    consecutive_count = models.PositiveSmallIntegerField(null=True, blank=True)
    missed_sessions = models.JSONField(default=list, blank=True)
    triggered_at = models.DateTimeField(auto_now_add=True)
    is_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-triggered_at']

    def __str__(self):
        label = self.student_name or self.matric_number or 'Student'
        return f"{self.alert_type.upper()} - {self.course.code} - {label}"
