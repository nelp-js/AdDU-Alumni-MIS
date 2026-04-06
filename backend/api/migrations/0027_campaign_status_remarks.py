from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0026_campaign_campaigndonation'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaign',
            name='remarks',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='campaign',
            name='status',
            field=models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')], default='pending', max_length=20),
        ),
    ]
