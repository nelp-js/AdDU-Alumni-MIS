# Generated manually for guest job/internship submissions

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_campaigndonation_frequency_payment_account'),
    ]

    operations = [
        migrations.AlterField(
            model_name='job',
            name='posted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='job_postings',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name='internship',
            name='posted_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='internship_postings',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
