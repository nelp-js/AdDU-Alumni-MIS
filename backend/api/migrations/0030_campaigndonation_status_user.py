from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0029_article_denied_hidden_remarks'),
    ]

    operations = [
        migrations.AlterField(
            model_name='campaigndonation',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('gcash', 'GCash'),
                    ('maya', 'Maya'),
                    ('qrph', 'QRPH'),
                    ('credit_debit', 'Credit/Debit'),
                    ('cash', 'Cash (University Cashier)'),
                ],
                default='gcash',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='campaigndonation',
            name='payment_status',
            field=models.CharField(
                choices=[('success', 'Success'), ('pending', 'Pending'), ('failed', 'Failed')],
                default='success',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='campaigndonation',
            name='user',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='campaign_donations',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
