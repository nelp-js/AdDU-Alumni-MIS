from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0042_campaign_category_community"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql="ALTER TABLE api_internship DROP COLUMN IF EXISTS internship_start_date;",
                    reverse_sql="ALTER TABLE api_internship ADD COLUMN internship_start_date date;",
                ),
                migrations.RunSQL(
                    sql="ALTER TABLE api_internship DROP COLUMN IF EXISTS internship_end_date;",
                    reverse_sql="ALTER TABLE api_internship ADD COLUMN internship_end_date date;",
                ),
                # Safety cleanup in case a hotfix migration added these to jobs.
                migrations.RunSQL(
                    sql="ALTER TABLE api_job DROP COLUMN IF EXISTS internship_start_date;",
                    reverse_sql="ALTER TABLE api_job ADD COLUMN internship_start_date date;",
                ),
                migrations.RunSQL(
                    sql="ALTER TABLE api_job DROP COLUMN IF EXISTS internship_end_date;",
                    reverse_sql="ALTER TABLE api_job ADD COLUMN internship_end_date date;",
                ),
            ],
            state_operations=[
                migrations.RemoveField(
                    model_name="internship",
                    name="internship_start_date",
                ),
                migrations.RemoveField(
                    model_name="internship",
                    name="internship_end_date",
                ),
            ],
        ),
    ]
