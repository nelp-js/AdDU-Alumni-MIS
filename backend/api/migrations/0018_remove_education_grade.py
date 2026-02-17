# Remove grade from Education

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0017_education_month_grade_activities"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="education",
            name="grade",
        ),
    ]
