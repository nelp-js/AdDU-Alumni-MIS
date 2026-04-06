from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_event_status_hidden_remarks'),
    ]

    operations = [
        migrations.AddField(
            model_name='article',
            name='is_hidden',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='article',
            name='remarks',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='article',
            name='status',
            field=models.CharField(choices=[('draft', 'Draft'), ('published', 'Published'), ('denied', 'Denied')], default='draft', max_length=20),
        ),
    ]
