# Article: subtitle required, add approved_at (content approval time)

from django.db import migrations, models


def fill_empty_subtitles(apps, schema_editor):
    Article = apps.get_model("api", "Article")
    Article.objects.filter(subtitle="").update(subtitle="—")


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0013_add_article"),
    ]

    operations = [
        migrations.AddField(
            model_name="article",
            name="approved_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(fill_empty_subtitles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="article",
            name="subtitle",
            field=models.CharField(max_length=280),
        ),
    ]
