from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0041_internship_duration_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="campaign",
            name="category",
            field=models.CharField(
                choices=[
                    ("Student Aid", "Student Aid"),
                    ("Infrastructure", "Infrastructure"),
                    ("Research", "Research"),
                    ("Faculty", "Faculty"),
                    ("Community", "Community"),
                ],
                default="Student Aid",
                max_length=50,
            ),
        ),
    ]
