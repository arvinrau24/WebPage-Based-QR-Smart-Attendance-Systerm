import alerts.models
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0008_attendancerecord_excused_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('alerts', '0003_alert_details'),
    ]

    operations = [
        migrations.AddField(
            model_name='alert',
            name='lecturer_message',
            field=models.TextField(blank=True, default=''),
        ),
        migrations.CreateModel(
            name='AlertSessionExcuse',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('matric_number', models.CharField(max_length=20)),
                ('reason_type', models.CharField(
                    choices=[
                        ('mc', 'Medical certificate (MC)'),
                        ('written_note', 'Written note / letter'),
                        ('official_letter', 'Official letter'),
                        ('other', 'Other supporting document'),
                    ],
                    max_length=20,
                )),
                ('reason_note', models.CharField(blank=True, max_length=255)),
                ('proof_file', models.FileField(upload_to=alerts.models.alert_excuse_upload_to)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('alert', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='excuses',
                    to='alerts.alert',
                )),
                ('course', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='session_excuses',
                    to='attendance.course',
                )),
                ('session', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='excuses',
                    to='attendance.session',
                )),
                ('uploaded_by', models.ForeignKey(
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='uploaded_excuses',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'ordering': ['-created_at'],
                'unique_together': {('session', 'matric_number')},
            },
        ),
    ]
