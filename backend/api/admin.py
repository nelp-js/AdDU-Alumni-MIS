from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    User, Event, UserProfile, Experience, Education,
    Job, Internship, VolunteerOpportunity, VolunteerRegistration,
    Campaign, CampaignDonation, Article, ActivityLog,
)

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # 1. VISIBLE COLUMNS: Added 'is_approved' here so you see it in the list
    list_display = ('username', 'email', 'first_name', 'last_name', 'batch', 'is_approved', 'is_staff')
    
    # 2. FILTERS: Added 'is_approved' so you can filter by "Pending" or "Approved"
    list_filter = ('is_approved', 'batch', 'program', 'is_staff', 'is_superuser')
    
    # 3. EDIT PAGE: Added 'is_approved' to the form so you can check/uncheck it manually
    fieldsets = UserAdmin.fieldsets + (
        ('Alumni Info', {'fields': ('batch', 'program', 'phone_number', 'valid_id', 'is_approved')}),
        ('Marriage Info', {'fields': ('is_married', 'maiden_name')}),
    )
    
    search_fields = ('username', 'first_name', 'last_name', 'email', 'batch')

    # OPTIONAL: Add an action to bulk-approve users like you did for events
    actions = ['approve_users']

    def approve_users(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, "Selected users have been approved.")
    
    approve_users.short_description = "Approve Selected Users"


# --- 2. Event Admin (This was already correct) ---
@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('event_name', 'organizer', 'start_date', 'is_approved')
    list_filter = ('is_approved', 'start_date', 'organizer') 
    search_fields = ('event_name', 'organizer__username', 'organizer__email')
    actions = ['approve_events']

    def approve_events(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, "Selected events have been approved.")
    
    approve_events.short_description = "Approve Selected Events"


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'location')
    search_fields = ('user__username', 'user__email')


@admin.register(Experience)
class ExperienceAdmin(admin.ModelAdmin):
    list_display = ('job_title', 'company_name', 'user', 'is_current')
    list_filter = ('employment_type', 'is_current')


@admin.register(Education)
class EducationAdmin(admin.ModelAdmin):
    list_display = ('school_name', 'degree', 'user')


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('position', 'company', 'location', 'status', 'is_hidden', 'created_at')
    list_filter = ('status', 'modality', 'employment_type', 'is_hidden')
    search_fields = ('position', 'company', 'email')


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ('position', 'company', 'location', 'status', 'is_hidden', 'created_at')
    list_filter = ('status', 'modality', 'is_hidden')
    search_fields = ('position', 'company', 'email')


@admin.register(VolunteerOpportunity)
class VolunteerOpportunityAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'organizer', 'status', 'is_hidden', 'created_at')
    list_filter = ('status', 'category', 'is_hidden')
    search_fields = ('title', 'organizer', 'location')


@admin.register(VolunteerRegistration)
class VolunteerRegistrationAdmin(admin.ModelAdmin):
    list_display = ('volunteer', 'user', 'registered_at')
    list_filter = ('registered_at',)
    search_fields = ('volunteer__title', 'user__username', 'user__email')


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'goal_amount', 'raised_amount', 'status', 'is_active', 'end_date')
    list_filter = ('status', 'category', 'is_active')
    search_fields = ('title', 'description')


@admin.register(CampaignDonation)
class CampaignDonationAdmin(admin.ModelAdmin):
    list_display = ('campaign', 'first_name', 'last_name', 'amount', 'payment_method', 'payment_status', 'donated_at')
    list_filter = ('payment_status', 'payment_method', 'frequency')
    search_fields = ('campaign__title', 'first_name', 'last_name', 'email')


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status', 'is_hidden', 'created_by', 'created_at', 'updated_at')
    list_filter = ('status', 'category', 'is_hidden')
    search_fields = ('title', 'author_name', 'subtitle')


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('timestamp', 'module', 'action', 'user', 'status')
    list_filter = ('module', 'status', 'timestamp')
    search_fields = ('action', 'module', 'user__username', 'user__email')