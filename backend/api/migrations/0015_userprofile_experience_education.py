# UserProfile, Experience, Education models for profile page

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0014_article_subtitle_required_approved_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="UserProfile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("profile_picture", models.ImageField(blank=True, null=True, upload_to="profile_pictures/")),
                ("cover_photo", models.ImageField(blank=True, null=True, upload_to="cover_photos/")),
                ("bio", models.TextField(blank=True, default="")),
                ("location", models.CharField(blank=True, default="", max_length=255)),
                ("website", models.URLField(blank=True, default="")),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="profile", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="Experience",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("job_title", models.CharField(max_length=200)),
                ("company_name", models.CharField(max_length=200)),
                ("employment_type", models.CharField(choices=[("full_time", "Full-time"), ("part_time", "Part-time"), ("freelance", "Freelance"), ("contract", "Contract"), ("internship", "Internship"), ("volunteer", "Volunteer")], default="full_time", max_length=50)),
                ("start_date", models.DateField(blank=True, null=True)),
                ("end_date", models.DateField(blank=True, null=True)),
                ("description", models.TextField(blank=True, default="")),
                ("is_current", models.BooleanField(default=False)),
                ("order", models.PositiveIntegerField(default=0)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="experiences", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-order", "-start_date"],
            },
        ),
        migrations.CreateModel(
            name="Education",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("school_name", models.CharField(max_length=255)),
                ("degree", models.CharField(blank=True, default="", max_length=200)),
                ("field_of_study", models.CharField(blank=True, default="", max_length=200)),
                ("start_year", models.PositiveIntegerField(blank=True, null=True)),
                ("end_year", models.PositiveIntegerField(blank=True, null=True)),
                ("description", models.TextField(blank=True, default="")),
                ("order", models.PositiveIntegerField(default=0)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="educations", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-order", "-start_year"],
            },
        ),
    ]
