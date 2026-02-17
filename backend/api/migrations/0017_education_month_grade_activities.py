# Add start_month, end_month, grade, activities to Education

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_experience_website_location"),
    ]

    operations = [
        migrations.AddField(
            model_name="education",
            name="start_month",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="education",
            name="end_month",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="education",
            name="grade",
            field=models.CharField(blank=True, default="", max_length=100),
        ),
        migrations.AddField(
            model_name="education",
            name="activities",
            field=models.TextField(blank=True, default=""),
        ),
    ]
