from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alerts', '0002_alter_alert_student'),
    ]

    operations = [
        migrations.AddField(
            model_name='alert',
            name='matric_number',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='alert',
            name='student_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='alert',
            name='student_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='alert',
            name='reason',
            field=models.CharField(
                blank=True,
                choices=[
                    ('consecutive_absence', 'Consecutive Absence'),
                    ('below_threshold', 'Below Attendance Threshold'),
                ],
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name='alert',
            name='attendance_percentage',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='alert',
            name='consecutive_count',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='alert',
            name='missed_sessions',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
