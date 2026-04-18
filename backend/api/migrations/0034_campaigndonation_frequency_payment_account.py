from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0033_volunteerregistration'),
    ]

    operations = [
        migrations.AddField(
            model_name='campaigndonation',
            name='frequency',
            field=models.CharField(blank=True, default='one-time', max_length=20),
        ),
        migrations.AddField(
            model_name='campaigndonation',
            name='payment_account',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
    ]
