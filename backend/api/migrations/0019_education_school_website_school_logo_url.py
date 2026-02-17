# Add school_website and school_logo_url for logo display

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0018_remove_education_grade"),
    ]

    operations = [
        migrations.AddField(
            model_name="education",
            name="school_website",
            field=models.URLField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="education",
            name="school_logo_url",
            field=models.URLField(blank=True, default=""),
        ),
    ]
