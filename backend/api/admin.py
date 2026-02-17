from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Event, UserProfile, Experience, Education

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