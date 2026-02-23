# Generated migration for Experience employment_type: optional + new choices

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0019_education_school_website_school_logo_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='experience',
            name='employment_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('', 'Please select'),
                    ('full_time', 'Full-time'),
                    ('part_time', 'Part-time'),
                    ('self_employed', 'Self-employed'),
                    ('freelance', 'Freelance'),
                    ('contract', 'Contract'),
                    ('internship', 'Internship'),
                    ('apprenticeship', 'Apprenticeship'),
                    ('seasonal', 'Seasonal'),
                    ('volunteer', 'Volunteer'),
                ],
                default='',
                max_length=50,
            ),
        ),
    ]
