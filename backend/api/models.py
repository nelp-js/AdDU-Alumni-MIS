from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import datetime


class User(AbstractUser):
    BATCH_CHOICES = [(str(year), str(year)) for year in range(1948, 2026)]
    PROGRAM_CHOICES = [('CS', 'Computer Science'), ('IT', 'Information Technology'), ('IS', 'Information Systems')]
    SEX_CHOICES = [('male', 'Male'), ('female', 'Female'), ('prefer_not_to_say', 'Prefer not to say')]
    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'), ('married', 'Married'), ('living_in', 'Living In'),
        ('separated', 'Separated'), ('annulled', 'Annulled'), ('divorced', 'Divorced'), ('widowed', 'Widowed'),
    ]

    first_name  = models.CharField(max_length=150)
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    last_name   = models.CharField(max_length=150)
    name        = models.CharField(max_length=255, blank=True, null=True)
    email       = models.EmailField(unique=True)
    birth_date  = models.DateField(null=True, blank=True)
    sex         = models.CharField(max_length=20, choices=SEX_CHOICES, blank=True, null=True)
    role        = models.CharField(max_length=50, default='alumni')

    phone_number     = models.CharField(max_length=20)
    telephone_number = models.CharField(max_length=20, blank=True, null=True)
    current_address  = models.TextField(blank=True, null=True)
    country          = models.CharField(max_length=100, default='Philippines')
    geocode          = models.CharField(max_length=20, blank=True, null=True)
    region           = models.CharField(max_length=100, blank=True, null=True)
    province         = models.CharField(max_length=100, blank=True, null=True)
    city             = models.CharField(max_length=100, blank=True, null=True)

    religion              = models.CharField(max_length=100, blank=True, null=True)
    religion_other        = models.CharField(max_length=100, blank=True, null=True)
    marital_status        = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, null=True)
    marriage_date         = models.CharField(max_length=7, blank=True, null=True)
    intend_to_marry       = models.CharField(max_length=10, blank=True, null=True)
    intended_marriage_age = models.PositiveIntegerField(null=True, blank=True)
    no_marriage_reason    = models.CharField(max_length=255, blank=True, null=True)
    is_married            = models.BooleanField(default=False)
    maiden_name           = models.CharField(max_length=150, blank=True, null=True)

    course      = models.CharField(max_length=2, choices=PROGRAM_CHOICES, blank=True, null=True)
    program     = models.CharField(max_length=2, choices=PROGRAM_CHOICES, blank=True, null=True)
    batch       = models.CharField(max_length=4, choices=BATCH_CHOICES, blank=True, null=True)
    batch_year  = models.CharField(max_length=4, choices=BATCH_CHOICES, blank=True, null=True)
    has_diploma = models.CharField(max_length=10, blank=True, null=True)

    id_type       = models.CharField(max_length=50, blank=True, null=True)
    valid_id      = models.ImageField(upload_to='valid_ids/', blank=True, null=True)
    valid_id_file = models.ImageField(upload_to='valid_ids/', blank=True, null=True)
    diploma_file  = models.ImageField(upload_to='diplomas/', blank=True, null=True)
    is_approved   = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    user            = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    cover_photo     = models.ImageField(upload_to='cover_photos/', null=True, blank=True)
    bio             = models.TextField(blank=True, default='')
    location        = models.CharField(max_length=255, blank=True, default='')
    website         = models.URLField(blank=True, default='')

    def __str__(self):
        return f"Profile of {self.user.username}"


class Experience(models.Model):
    EMPLOYMENT_TYPES = [
        ('', 'Please select'), ('full_time', 'Full-time'), ('part_time', 'Part-time'),
        ('self_employed', 'Self-employed'), ('freelance', 'Freelance'), ('contract', 'Contract'),
        ('internship', 'Internship'), ('apprenticeship', 'Apprenticeship'),
        ('seasonal', 'Seasonal'), ('volunteer', 'Volunteer'),
    ]
    SITE_TYPES = [('', ''), ('on_site', 'On-site'), ('remote', 'Remote'), ('hybrid', 'Hybrid')]

    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    job_title       = models.CharField(max_length=200)
    company_name    = models.CharField(max_length=200)
    website         = models.URLField(blank=True, default='')
    location        = models.CharField(max_length=255, blank=True, default='')
    employment_type = models.CharField(max_length=50, choices=EMPLOYMENT_TYPES, blank=True, default='')
    site_type       = models.CharField(max_length=20, choices=SITE_TYPES, blank=True, default='')
    aligned_to_degree = models.BooleanField(default=False)
    income_range      = models.CharField(max_length=50, blank=True, default='')
    start_date      = models.DateField(null=True, blank=True)
    end_date        = models.DateField(null=True, blank=True)
    description     = models.TextField(blank=True, default='')
    is_current      = models.BooleanField(default=False)
    order           = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-order', '-start_date']

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"


class Education(models.Model):
    user            = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    school_name     = models.CharField(max_length=255)
    school_website  = models.URLField(blank=True, default='')
    school_logo_url = models.URLField(blank=True, default='')
    degree          = models.CharField(max_length=200, blank=True, default='')
    field_of_study  = models.CharField(max_length=200, blank=True, default='')
    start_month     = models.PositiveSmallIntegerField(null=True, blank=True)
    start_year      = models.PositiveIntegerField(null=True, blank=True)
    end_month       = models.PositiveSmallIntegerField(null=True, blank=True)
    end_year        = models.PositiveIntegerField(null=True, blank=True)
    activities      = models.TextField(blank=True, default='')
    description     = models.TextField(blank=True, default='')
    order           = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-order', '-start_year']

    def __str__(self):
        return f"{self.degree} at {self.school_name}"


class Event(models.Model):
    event_name          = models.CharField(max_length=255)
    preview_text        = models.CharField(max_length=280, blank=True, null=True)
    event_description   = models.TextField()
    category            = models.CharField(max_length=100, default="General")
    start_date          = models.DateField()
    end_date            = models.DateField(null=True, blank=True)
    start_time          = models.TimeField()
    end_time            = models.TimeField(null=True, blank=True)
    venue               = models.CharField(max_length=255)
    participants        = models.PositiveIntegerField(default=0)
    event_image         = models.ImageField(upload_to='events/', null=True, blank=True)
    cost                = models.CharField(max_length=100, blank=True, null=True)
    organizer_names     = models.CharField(max_length=500, blank=True, null=True)
    is_approved         = models.BooleanField(default=False)
    STATUS_CHOICES      = [('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')]
    status              = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks             = models.TextField(blank=True, null=True)
    is_hidden           = models.BooleanField(default=False)
    organizer           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_events')
    action_button_label = models.CharField(max_length=100, blank=True, null=True)
    action_button_link  = models.URLField(max_length=500, blank=True, null=True)
    created_at          = models.DateTimeField(auto_now_add=True, null=True)
    updated_at          = models.DateTimeField(auto_now=True, null=True)
    timeline_status     = models.CharField(max_length=20, default='', blank=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return self.event_name

    def save(self, *args, **kwargs):
        if self.status != 'approved' and not self.is_approved:
            self.timeline_status = ''
        else:
            now = timezone.now()
            start_dt = timezone.make_aware(datetime.datetime.combine(self.start_date, self.start_time))
            
            end_d = self.end_date if self.end_date else self.start_date
            end_t = self.end_time if self.end_time else datetime.time(23, 59, 59)
            end_dt = timezone.make_aware(datetime.datetime.combine(end_d, end_t))
            
            if now < start_dt:
                self.timeline_status = 'Upcoming'
            elif start_dt <= now <= end_dt:
                self.timeline_status = 'Ongoing'
            else:
                self.timeline_status = 'Completed'
                
        super().save(*args, **kwargs)


class EventRegistration(models.Model):
    PAYMENT_METHOD_CHOICES = [('gcash', 'GCash'), ('maya', 'Maya'), ('card', 'Credit/Debit Card')]
    STATUS_CHOICES         = [('pending', 'Pending'), ('success', 'Success'), ('failed', 'Failed')]

    event          = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    user           = models.ForeignKey(User, on_delete=models.CASCADE, related_name='event_registrations')
    first_name     = models.CharField(max_length=150)
    last_name      = models.CharField(max_length=150)
    guest_count    = models.PositiveIntegerField(default=0)
    guests         = models.JSONField(default=list, blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='gcash')
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_amount   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    registered_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-registered_at']
        unique_together = ['event', 'user']

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.event.event_name}"


class Job(models.Model):
    MODALITY_CHOICES   = [('On-site', 'On-site'), ('Remote', 'Remote'), ('Hybrid', 'Hybrid')]
    EMPLOYMENT_CHOICES = [('Full-time', 'Full-time'), ('Part-time', 'Part-time'), ('Contract', 'Contract'), ('Freelance', 'Freelance')]
    STATUS_CHOICES     = [('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')]

    company         = models.CharField(max_length=255)
    position        = models.CharField(max_length=255)
    location        = models.CharField(max_length=255)
    modality        = models.CharField(max_length=20, choices=MODALITY_CHOICES)
    employment_type = models.CharField(max_length=20, choices=EMPLOYMENT_CHOICES)
    salary          = models.CharField(max_length=100, blank=True, null=True)
    contact_name    = models.CharField(max_length=255, blank=True, null=True)
    contact_position = models.CharField(max_length=255, blank=True, null=True)
    email           = models.EmailField()
    start_date      = models.DateField()
    end_date        = models.DateField()
    internship_start_date = models.DateField(blank=True, null=True)
    internship_end_date = models.DateField(blank=True, null=True)
    description     = models.TextField()
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks         = models.TextField(blank=True, null=True)
    is_hidden       = models.BooleanField(default=False)
    posted_by       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='job_postings')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    timeline_status = models.CharField(max_length=20, default='', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.position} at {self.company}"

    def save(self, *args, **kwargs):
        if self.status != 'approved':
            self.timeline_status = ''
        else:
            today = datetime.date.today()
            if today < self.start_date:
                self.timeline_status = 'Upcoming'
            elif self.start_date <= today <= self.end_date:
                self.timeline_status = 'Ongoing'
            else:
                self.timeline_status = 'Completed'
                
        super().save(*args, **kwargs)


class Internship(models.Model):
    MODALITY_CHOICES = [('On-site', 'On-site'), ('Remote', 'Remote'), ('Hybrid', 'Hybrid')]
    STATUS_CHOICES   = [('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')]

    company         = models.CharField(max_length=255)
    position        = models.CharField(max_length=255)
    location        = models.CharField(max_length=255)
    modality        = models.CharField(max_length=20, choices=MODALITY_CHOICES)
    allowance       = models.CharField(max_length=100, blank=True, null=True)
    contact_name    = models.CharField(max_length=255, blank=True, null=True)
    contact_position = models.CharField(max_length=255, blank=True, null=True)
    email           = models.EmailField()
    start_date      = models.DateField()
    end_date        = models.DateField()
    description     = models.TextField()
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks         = models.TextField(blank=True, null=True)
    is_hidden       = models.BooleanField(default=False)
    posted_by       = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='internship_postings')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    timeline_status = models.CharField(max_length=20, default='', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.position} at {self.company} (Internship)"

    def save(self, *args, **kwargs):
        if self.status != 'approved':
            self.timeline_status = ''
        else:
            today = datetime.date.today()
            if today < self.start_date:
                self.timeline_status = 'Upcoming'
            elif self.start_date <= today <= self.end_date:
                self.timeline_status = 'Ongoing'
            else:
                self.timeline_status = 'Completed'
                
        super().save(*args, **kwargs)


class VolunteerOpportunity(models.Model):
    CATEGORY_CHOICES = [
        ('Alumni teaching', 'Alumni teaching'),
        ('Mentorship', 'Mentorship'),
        ('Projects', 'Projects'),
        ('Community Engagement', 'Community Engagement'),
        ('Volunteer Activities', 'Volunteer Activities'),
    ]
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')]

    title           = models.CharField(max_length=60)
    category        = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    description     = models.TextField()
    start_date      = models.DateField()
    end_date        = models.DateField()
    cover_photo     = models.ImageField(upload_to='volunteers/')
    summary         = models.CharField(max_length=240)
    location        = models.CharField(max_length=60)
    organizer       = models.CharField(max_length=60)
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks         = models.TextField(blank=True, null=True)
    is_hidden       = models.BooleanField(default=False)
    created_by      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='volunteer_opportunities')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    timeline_status = models.CharField(max_length=20, default='', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status != 'approved':
            self.timeline_status = ''
        else:
            today = datetime.date.today()
            if today < self.start_date:
                self.timeline_status = 'Upcoming'
            elif self.start_date <= today <= self.end_date:
                self.timeline_status = 'Ongoing'
            else:
                self.timeline_status = 'Completed'
                
        super().save(*args, **kwargs)


class VolunteerRegistration(models.Model):
    volunteer = models.ForeignKey(VolunteerOpportunity, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='volunteer_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-registered_at']
        unique_together = ['volunteer', 'user']

    def __str__(self):
        return f"{self.user.username} — {self.volunteer.title}"


class Campaign(models.Model):
    CATEGORY_CHOICES = [
        ('Student Aid',    'Student Aid'),
        ('Infrastructure', 'Infrastructure'),
        ('Research',       'Research'),
        ('Faculty',        'Faculty'),
        ('Community',      'Community'),
    ]
    STATUS_CHOICES = [('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied')]

    title           = models.CharField(max_length=255)
    description     = models.TextField(blank=True, default='')
    category        = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Student Aid')
    cover_image     = models.ImageField(upload_to='campaigns/', null=True, blank=True)
    image_url       = models.URLField(max_length=500, blank=True, null=True)
    goal_amount     = models.DecimalField(max_digits=12, decimal_places=2)
    raised_amount   = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    donors_count    = models.PositiveIntegerField(default=0)
    end_date        = models.DateField()
    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    remarks         = models.TextField(blank=True, null=True)
    is_active       = models.BooleanField(default=True)
    created_by      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='campaigns')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)
    timeline_status = models.CharField(max_length=20, default='', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.status != 'approved':
            self.timeline_status = ''
        else:
            today = datetime.date.today()
            # If created_at doesn't exist yet (brand new), use today
            start_date = self.created_at.date() if self.created_at else today
            
            if today < start_date:
                self.timeline_status = 'Upcoming'
            elif start_date <= today <= self.end_date:
                self.timeline_status = 'Ongoing'
            else:
                self.timeline_status = 'Completed'
                
        super().save(*args, **kwargs)


class CampaignDonation(models.Model):
    PAYMENT_CHOICES = [
        ('gcash',         'GCash'),
        ('maya',          'Maya'),
        ('qrph',          'QRPH'),
        ('credit_debit',  'Credit/Debit'),
        ('cash',          'Cash (University Cashier)'),
    ]
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('pending', 'Pending'),
        ('failed',  'Failed'),
    ]

    campaign       = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='donations')
    user           = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='campaign_donations')
    first_name     = models.CharField(max_length=150)
    last_name      = models.CharField(max_length=150)
    email          = models.EmailField()
    amount         = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='gcash')
    payment_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='success')
    frequency      = models.CharField(max_length=20, blank=True, default='one-time')
    payment_account= models.CharField(max_length=64, blank=True, default='')
    donated_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-donated_at']

    def __str__(self):
        return f"{self.first_name} {self.last_name} — ₱{self.amount} to {self.campaign.title}"


class Article(models.Model):
    STATUS_DRAFT     = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_DENIED    = 'denied'
    STATUS_CHOICES   = [(STATUS_DRAFT, 'Draft'), (STATUS_PUBLISHED, 'Published'), (STATUS_DENIED, 'Denied')]
    CATEGORY_CHOICES = [
        ('Giving', 'Giving'), ('Programs', 'Programs'), ('Community', 'Community'),
        ('Events', 'Events'), ('Achievements', 'Achievements'), ('Scholarship', 'Scholarship'),
    ]

    title       = models.CharField(max_length=255)
    author_name = models.CharField(max_length=255)
    subtitle    = models.CharField(max_length=280)
    category    = models.CharField(max_length=100, choices=CATEGORY_CHOICES, default='Community')
    is_featured = models.BooleanField(default=False)
    cover_image = models.ImageField(upload_to='article_covers/', null=True, blank=True)
    content     = models.TextField(blank=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    remarks     = models.TextField(blank=True, null=True)
    is_hidden   = models.BooleanField(default=False)
    created_by  = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='articles')
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    MODULE_CHOICES = [
        ('User Management', 'User Management'), ('Event Management', 'Event Management'),
        ('Job & Internship', 'Job & Internship'), ('CMS & News Feed', 'CMS & News Feed'),
        ('Fundraising', 'Fundraising'), ('Feedback & Surveys', 'Feedback & Surveys'), ('Volunteer', 'Volunteer'),
    ]

    action    = models.CharField(max_length=255)
    module    = models.CharField(max_length=50, choices=MODULE_CHOICES)
    user      = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    status    = models.CharField(max_length=50, default='Completed')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} - {self.timestamp}"


class PasswordReset(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE)
    otp        = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reset for {self.user.username}"