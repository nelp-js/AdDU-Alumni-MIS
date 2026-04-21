from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0040_job_internship_contact_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="internship",
            name="internship_start_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="internship",
            name="internship_end_date",
            field=models.DateField(blank=True, null=True),
        ),
    ]
