# Add site_type to Experience (On-site, Remote, Hybrid)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0020_experience_employment_optional'),
    ]

    operations = [
        migrations.AddField(
            model_name='experience',
            name='site_type',
            field=models.CharField(
                blank=True,
                choices=[('', ''), ('on_site', 'On-site'), ('remote', 'Remote'), ('hybrid', 'Hybrid')],
                default='',
                max_length=20,
            ),
        ),
    ]
