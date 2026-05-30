# Generated migration for geofence_polygon field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0008_attendancerecord_excused_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='geofence_polygon',
            field=models.JSONField(blank=True, default=list, help_text='Faculty boundary polygon coordinates [(lat, lon), ...]'),
        ),
        migrations.AlterField(
            model_name='attendancerecord',
            name='status',
            field=models.CharField(choices=[('present', 'Present'), ('absent', 'Absent'), ('excused', 'Excused'), ('pending', 'Pending Approval')], default='absent', max_length=10),
        ),
    ]
