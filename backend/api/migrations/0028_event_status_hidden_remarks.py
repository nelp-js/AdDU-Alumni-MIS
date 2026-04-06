from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_campaign_status_remarks'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='is_hidden',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='event',
            name='remarks',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='event',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')], default='pending', max_length=20),
        ),
    ]
