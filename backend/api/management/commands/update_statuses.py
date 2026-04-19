from django.core.management.base import BaseCommand
from api.models import Event, Job, Internship, VolunteerOpportunity, Campaign

class Command(BaseCommand):
    help = 'Updates the timeline_status for all time-sensitive models'

    def handle(self, *args, **kwargs):
        self.stdout.write("Updating statuses...")

        # 1. Update ALL Events
        for event in Event.objects.all():
            event.save() 

        # 2. Update ALL Jobs
        for job in Job.objects.all():
            job.save()

        # 3. Update ALL Internships
        for internship in Internship.objects.all():
            internship.save()

        # 4. Update ALL Volunteers
        for volunteer in VolunteerOpportunity.objects.all():
            volunteer.save()

        # 5. Update ALL Campaigns
        for campaign in Campaign.objects.all():
            campaign.save()

        self.stdout.write(self.style.SUCCESS("Successfully updated all timeline statuses!"))