from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0007_course_semester_dates'),
    ]

    operations = [
        migrations.AlterField(
            model_name='attendancerecord',
            name='status',
            field=models.CharField(
                choices=[
                    ('present', 'Present'),
                    ('absent', 'Absent'),
                    ('excused', 'Excused'),
                ],
                default='absent',
                max_length=10,
            ),
        ),
    ]
