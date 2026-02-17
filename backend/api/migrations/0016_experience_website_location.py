# Add website and location to Experience

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0015_userprofile_experience_education"),
    ]

    operations = [
        migrations.AddField(
            model_name="experience",
            name="website",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="experience",
            name="location",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
