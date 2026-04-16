from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0032_volunteeropportunity_and_activitylog_module'),
    ]

    operations = [
        migrations.CreateModel(
            name='VolunteerRegistration',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('registered_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='volunteer_registrations', to=settings.AUTH_USER_MODEL)),
                ('volunteer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='registrations', to='api.volunteeropportunity')),
            ],
            options={
                'ordering': ['-registered_at'],
                'unique_together': {('volunteer', 'user')},
            },
        ),
    ]
