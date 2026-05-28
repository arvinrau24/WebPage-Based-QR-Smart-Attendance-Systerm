from django.db import models
from django.conf import settings
import uuid

class Course(models.Model):
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    section = models.CharField(max_length=20, blank=True, null=True)
    lecturer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses'
    )
    students = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='enrolled_courses',
        blank=True
    )

    def __str__(self):
        return f"{self.code} - {self.name}"


class Session(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_finalized = models.BooleanField(default=False)  # ADD THIS

    def __str__(self):
        return f"{self.course.code} - {self.date}"


class QRToken(models.Model):
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='qr_tokens')
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"QR for {self.session} - expires {self.expires_at}"


class AttendanceRecord(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
    )
    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='attendance_records',
        null=True, blank=True
    )
    full_name = models.CharField(max_length=100, blank=True, null=True)
    matric_number = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='absent')
    scanned_at = models.DateTimeField(blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    gps_verified = models.BooleanField(default=False)

    class Meta:
        unique_together = ('session', 'matric_number')

    def __str__(self):
        return f"{self.matric_number} - {self.session} - {self.status}"
    
class StudentProfile(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='student_profiles')
    matric_number = models.CharField(max_length=20)
    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    section = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        unique_together = ('course', 'matric_number')

    def __str__(self):
        return f"{self.matric_number} - {self.full_name} ({self.section})"