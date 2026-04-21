from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0039_alter_campaign_timeline_status_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="job",
            name="contact_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="job",
            name="contact_position",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="internship",
            name="contact_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="internship",
            name="contact_position",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]
