from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0006_alter_course_code_max_length'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='semester_start',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='course',
            name='semester_end',
            field=models.DateField(blank=True, null=True),
        ),
    ]
