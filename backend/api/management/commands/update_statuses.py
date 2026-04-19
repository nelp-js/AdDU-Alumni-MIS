from django.core.management.base import BaseCommand
from api.models import Event, Job, Internship, VolunteerOpportunity, Campaign

class Command(BaseCommand):
    help = 'Updates the timeline_status for all time-sensitive models'

    def handle(self, *args, **kwargs):
        self.stdout.write("Updating statuses...")

        # 1. Update Events
        for event in Event.objects.filter(status='approved'):
            event.save() 

        # 2. Update Jobs
        for job in Job.objects.filter(status='approved'):
            job.save()

        # 3. Update Internships
        for internship in Internship.objects.filter(status='approved'):
            internship.save()

        # 4. Update Volunteers
        for volunteer in VolunteerOpportunity.objects.filter(status='approved'):
            volunteer.save()

        # 5. Update Campaigns
        for campaign in Campaign.objects.filter(status='approved'):
            campaign.save()

        self.stdout.write(self.style.SUCCESS("Successfully updated all timeline statuses!"))