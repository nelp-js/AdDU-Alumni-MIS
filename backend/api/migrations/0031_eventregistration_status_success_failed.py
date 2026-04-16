from django.db import migrations, models


def map_legacy_payment_statuses(apps, schema_editor):
    EventRegistration = apps.get_model('api', 'EventRegistration')
    EventRegistration.objects.filter(payment_status='paid').update(payment_status='success')
    EventRegistration.objects.filter(payment_status='cancelled').update(payment_status='failed')


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0030_campaigndonation_status_user'),
    ]

    operations = [
        migrations.AlterField(
            model_name='eventregistration',
            name='payment_status',
            field=models.CharField(
                choices=[('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.RunPython(map_legacy_payment_statuses, migrations.RunPython.noop),
    ]
