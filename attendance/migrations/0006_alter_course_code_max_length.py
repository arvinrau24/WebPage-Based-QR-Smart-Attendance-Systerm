from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0005_session_is_finalized'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='code',
            field=models.CharField(max_length=50, unique=True),
        ),
        migrations.AlterField(
            model_name='course',
            name='name',
            field=models.CharField(max_length=150),
        ),
    ]
