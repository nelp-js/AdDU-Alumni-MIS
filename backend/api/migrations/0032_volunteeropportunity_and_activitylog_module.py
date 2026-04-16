from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_eventregistration_status_success_failed'),
    ]

    operations = [
        migrations.CreateModel(
            name='VolunteerOpportunity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=60)),
                ('category', models.CharField(choices=[('Alumni teaching', 'Alumni teaching'), ('Mentorship', 'Mentorship'), ('Projects', 'Projects'), ('Community Engagement', 'Community Engagement'), ('Volunteer Activities', 'Volunteer Activities')], max_length=100)),
                ('description', models.TextField()),
                ('start_date', models.DateField()),
                ('end_date', models.DateField()),
                ('cover_photo', models.ImageField(upload_to='volunteers/')),
                ('summary', models.CharField(max_length=240)),
                ('location', models.CharField(max_length=60)),
                ('organizer', models.CharField(max_length=60)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')], default='pending', max_length=20)),
                ('remarks', models.TextField(blank=True, null=True)),
                ('is_hidden', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='volunteer_opportunities', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AlterField(
            model_name='activitylog',
            name='module',
            field=models.CharField(choices=[('User Management', 'User Management'), ('Event Management', 'Event Management'), ('Job & Internship', 'Job & Internship'), ('CMS & News Feed', 'CMS & News Feed'), ('Fundraising', 'Fundraising'), ('Feedback & Surveys', 'Feedback & Surveys'), ('Volunteer', 'Volunteer')], max_length=50),
        ),
    ]
