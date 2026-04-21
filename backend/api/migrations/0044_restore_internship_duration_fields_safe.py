from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0043_remove_internship_duration_fields_safe"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE api_internship ADD COLUMN IF NOT EXISTS internship_start_date date;",
                    reverse_sql="ALTER TABLE api_internship DROP COLUMN IF EXISTS internship_start_date;",
                ),
                migrations.RunSQL(
                    sql="ALTER TABLE api_internship ADD COLUMN IF NOT EXISTS internship_end_date date;",
                    reverse_sql="ALTER TABLE api_internship DROP COLUMN IF EXISTS internship_end_date;",
                ),
            ],
            state_operations=[
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
            ],
        ),
    ]
