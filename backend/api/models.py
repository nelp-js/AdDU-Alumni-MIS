from django.db import models
from django.contrib.auth.models import AbstractUser
import datetime

class User(AbstractUser):
    BATCH_CHOICES = [(str(year), str(year)) for year in range(1948, datetime.date.today().year + 2)]
    
    PROGRAM_CHOICES = [
        ('CS', 'Computer Science'),
        ('IT', 'Information Technology'),
        ('IS', 'Information Systems'),
    ]

    SEX_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('living_in', 'Living In'),
        ('separated', 'Separated'),
        ('annulled', 'Annulled'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ]

    # --- 1. PERSONAL INFO ---
    first_name = models.CharField(max_length=150)
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    last_name = models.CharField(max_length=150)
    # name field is concatenated on the frontend
    name = models.CharField(max_length=255, blank=True, null=True) 
    
    email = models.EmailField(unique=True)
    birth_date = models.DateField(null=True, blank=True)
    sex = models.CharField(max_length=20, choices=SEX_CHOICES, blank=True, null=True)
    
    # role is sent as 'alumni' by default
    role = models.CharField(max_length=50, default='alumni') 

    # --- 2. CONTACT & LOCATION ---
    phone_number = models.CharField(max_length=20)
    telephone_number = models.CharField(max_length=20, blank=True, null=True)
    current_address = models.TextField(blank=True, null=True)
    country = models.CharField(max_length=100, default='Philippines')
    geocode = models.CharField(max_length=20, blank=True, null=True)
    
    # These are conditional on the frontend (Only for Philippines)
    region = models.CharField(max_length=100, blank=True, null=True)
    province = models.CharField(max_length=100, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)

    # --- 3. CIVIL / MARITAL STATUS ---
    religion = models.CharField(max_length=100, blank=True, null=True)
    religion_other = models.CharField(max_length=100, blank=True, null=True)
    marital_status = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True, null=True)
    
    # Stored as YYYY-MM string based on frontend input
    marriage_date = models.CharField(max_length=7, blank=True, null=True) 
    
    intend_to_marry = models.CharField(max_length=10, blank=True, null=True)
    intended_marriage_age = models.PositiveIntegerField(null=True, blank=True)
    no_marriage_reason = models.CharField(max_length=255, blank=True, null=True)

    # Legacy field (Keep this if you don't want to break existing database rows)
    is_married = models.BooleanField(default=False)
    maiden_name = models.CharField(max_length=150, blank=True, null=True)

    # --- 4. ACADEMIC INFO ---
    course = models.CharField(max_length=2, choices=PROGRAM_CHOICES, blank=True, null=True)
    program = models.CharField(max_length=2, choices=PROGRAM_CHOICES, blank=True, null=True) 
    batch = models.CharField(max_length=4, choices=BATCH_CHOICES, blank=True, null=True)
    batch_year = models.CharField(max_length=4, choices=BATCH_CHOICES, blank=True, null=True)
    
    has_diploma = models.CharField(max_length=10, blank=True, null=True)

    # --- 5. VERIFICATION DOCUMENTS ---
    id_type = models.CharField(max_length=50, blank=True, null=True)
    valid_id = models.ImageField(upload_to='valid_ids/', blank=True, null=True)
    valid_id_file = models.ImageField(upload_to='valid_ids/', blank=True, null=True)
    diploma_file = models.ImageField(upload_to='diplomas/', blank=True, null=True)

    # Admin approval
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """Extended profile: picture, cover, bio, location, website."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    cover_photo = models.ImageField(upload_to='cover_photos/', null=True, blank=True)
    bio = models.TextField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    website = models.URLField(blank=True, default='')

    def __str__(self):
        return f"Profile of {self.user.username}"


class Experience(models.Model):
    EMPLOYMENT_TYPES = [
        ('', 'Please select'),
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('self_employed', 'Self-employed'),
        ('freelance', 'Freelance'),
        ('contract', 'Contract'),
        ('internship', 'Internship'),
        ('apprenticeship', 'Apprenticeship'),
        ('seasonal', 'Seasonal'),
        ('volunteer', 'Volunteer'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='experiences')
    job_title = models.CharField(max_length=200)
    company_name = models.CharField(max_length=200)
    website = models.URLField(blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    employment_type = models.CharField(max_length=50, choices=EMPLOYMENT_TYPES, blank=True, default='')
    SITE_TYPES = [
        ('', ''),
        ('on_site', 'On-site'),
        ('remote', 'Remote'),
        ('hybrid', 'Hybrid'),
    ]
    site_type = models.CharField(max_length=20, choices=SITE_TYPES, blank=True, default='')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    is_current = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-order', '-start_date']

    def __str__(self):
        return f"{self.job_title} at {self.company_name}"


class Education(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='educations')
    school_name = models.CharField(max_length=255)
    school_website = models.URLField(blank=True, default='')  # for logo favicon fallback
    school_logo_url = models.URLField(blank=True, default='')   # cached logo from Wikidata
    degree = models.CharField(max_length=200, blank=True, default='')
    field_of_study = models.CharField(max_length=200, blank=True, default='')
    start_month = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-12
    start_year = models.PositiveIntegerField(null=True, blank=True)
    end_month = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-12
    end_year = models.PositiveIntegerField(null=True, blank=True)
    activities = models.TextField(blank=True, default='')  # activities and societies
    description = models.TextField(blank=True, default='')
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-order', '-start_year']

    def __str__(self):
        return f"{self.degree} at {self.school_name}"


class Event(models.Model):
    # Existing fields
    event_name = models.CharField(max_length=200)
    preview_text = models.CharField(max_length=280, default="")
    event_description = models.TextField()
    start_date = models.DateField()
    start_time = models.TimeField()
    venue = models.CharField(max_length=200)
    category = models.CharField(max_length=100, default="General") # Added default
    is_approved = models.BooleanField(default=False)
    organizer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='events')

    # --- NEW FIELDS TO MATCH FRONTEND ---
    end_date = models.DateField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    event_image = models.ImageField(upload_to='event_images/', null=True, blank=True)
    cost = models.CharField(max_length=100, null=True, blank=True) # e.g. "3000 pesos"
    
    # For the manual organizer names (Thor Hanson, etc.)
    organizer_names = models.CharField(max_length=500, null=True, blank=True)
    
    # Action Button Logic
    action_button_label = models.CharField(max_length=100, null=True, blank=True)
    action_button_link = models.URLField(null=True, blank=True)

    def __str__(self):
        return self.event_name


class Article(models.Model):
    """News / story content for CMS. Draft or published."""
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_CHOICES = [
        (STATUS_DRAFT, 'Draft'),
        (STATUS_PUBLISHED, 'Published'),
    ]

    title = models.CharField(max_length=255)
    author_name = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=280)  # required (deck)
    cover_image = models.ImageField(upload_to='article_covers/', null=True, blank=True)
    content = models.TextField(blank=True)  # HTML from rich text editor
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='articles')
    created_at = models.DateTimeField(auto_now_add=True)  # content created time
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)  # set when admin publishes

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    MODULE_CHOICES = [
        ('User Management', 'User Management'),
        ('Event Management', 'Event Management'),
        ('Job & Internship', 'Job & Internship'),
        ('CMS & News Feed', 'CMS & News Feed'),
        ('Fundraising', 'Fundraising'),
        ('Feedback & Surveys', 'Feedback & Surveys'),
    ]

    action = models.CharField(max_length=255)  # e.g., "New user approved"
    module = models.CharField(max_length=50, choices=MODULE_CHOICES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True) # Who did it?
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='Completed') # e.g., "Success", "Pending"

    class Meta:
        ordering = ['-timestamp']  # Show newest first automatically

    def __str__(self):
        return f"{self.action} - {self.timestamp}"

# --- NEW MODEL FOR FORGOT PASSWORD ---
class PasswordReset(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Reset for {self.user.username}"