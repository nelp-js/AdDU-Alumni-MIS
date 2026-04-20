from django.urls import path
from . import views
from .views import ActivityLogListView

urlpatterns = [
    # --- USER VIEWS ---
    path("user/me/",                        views.current_user,                   name="current-user"),
    path("user/register/",                  views.CreateUserView.as_view(),        name="register"),
    path("profile/",                        views.profile_detail,                  name="profile-detail"),
    path("profile/experiences/",            views.ExperienceListCreate.as_view(),  name="experience-list"),
    path("profile/experiences/<int:pk>/",   views.ExperienceDetail.as_view(),      name="experience-detail"),
    path("profile/educations/",             views.EducationListCreate.as_view(),   name="education-list"),
    path("profile/educations/<int:pk>/",    views.EducationDetail.as_view(),       name="education-detail"),
    path("users/pending-count/",            views.pending_user_count,              name="pending-user-count"),
    path("users/",                          views.UserListView.as_view(),           name="user-list"),
    path("users/public/",                   views.public_alumni_list,               name="public-alumni-list"),
    path("users/public/<int:user_id>/",     views.public_alumni_detail,             name="public-alumni-detail"),
    path("users/<int:pk>/",                 views.UserDetailView.as_view(),         name="user-detail"),
    path("users/<int:user_id>/approve/",    views.approve_user,                    name="approve-user"),
    path("users/<int:user_id>/reject/",     views.reject_user,                     name="reject-user"),

    # --- EVENT VIEWS ---
    path("events/",                                             views.EventListCreate.as_view(),        name="event-list"),
    path("events/delete/<int:pk>/",                             views.EventDelete.as_view(),            name="delete-event"),
    path("events/registrations/all/",                           views.all_registrations,                name="all-registrations"),
    path("events/registrations/mine/",                          views.my_registrations,                 name="my-registrations"),
    path("events/registrations/<int:registration_id>/status/",  views.update_registration_status,       name="update-registration-status"),
    path("events/<int:pk>/",                                    views.EventDetailView.as_view(),        name="event-detail"),
    path("events/<int:event_id>/approve/",                      views.approve_event,                    name="approve-event"),
    path("events/<int:event_id>/reject/",                       views.reject_event,                     name="reject-event"),
    path("events/<int:event_id>/deny/",                         views.deny_event,                       name="deny-event"),
    path("events/<int:event_id>/toggle-hide/",                  views.event_toggle_hide,                name="event-toggle-hide"),
    path("events/<int:event_id>/register/",                     views.register_for_event,               name="event-register"),
    path("events/<int:event_id>/registrations/",                views.event_registrations,              name="event-registrations"),

    # --- JOB VIEWS ---
    path("jobs/",                           views.job_list_create,   name="job-list"),
    path("jobs/admin/",                     views.job_admin_list,    name="job-admin-list"),
    path("jobs/<int:job_id>/",              views.job_detail,        name="job-detail"),
    path("jobs/<int:job_id>/approve/",      views.job_approve,       name="job-approve"),
    path("jobs/<int:job_id>/deny/",         views.job_deny,          name="job-deny"),
    path("jobs/<int:job_id>/toggle-hide/",  views.job_toggle_hide,   name="job-toggle-hide"),

    # --- INTERNSHIP VIEWS ---
    path("internships/",                                    views.internship_list_create,    name="internship-list"),
    path("internships/admin/",                              views.internship_admin_list,     name="internship-admin-list"),
    path("internships/<int:internship_id>/",                views.internship_detail,         name="internship-detail"),
    path("internships/<int:internship_id>/approve/",        views.internship_approve,        name="internship-approve"),
    path("internships/<int:internship_id>/deny/",           views.internship_deny,           name="internship-deny"),
    path("internships/<int:internship_id>/toggle-hide/",    views.internship_toggle_hide,    name="internship-toggle-hide"),

    # --- VOLUNTEER VIEWS ---
    path("volunteers/",                                  views.volunteer_list_create,   name="volunteer-list"),
    path("volunteers/admin/",                            views.volunteer_admin_list,    name="volunteer-admin-list"),
    path("volunteers/public/<int:volunteer_id>/",        views.volunteer_public_detail, name="volunteer-public-detail"),
    path("volunteers/registrations/all/",                views.volunteer_all_registrations, name="volunteer-all-registrations"),
    path("volunteers/<int:volunteer_id>/",               views.volunteer_detail,        name="volunteer-detail"),
    path("volunteers/<int:volunteer_id>/register/",      views.volunteer_register,      name="volunteer-register"),
    path("volunteers/<int:volunteer_id>/approve/",       views.volunteer_approve,       name="volunteer-approve"),
    path("volunteers/<int:volunteer_id>/deny/",          views.volunteer_deny,          name="volunteer-deny"),
    path("volunteers/<int:volunteer_id>/toggle-hide/",   views.volunteer_toggle_hide,   name="volunteer-toggle-hide"),

    # --- CAMPAIGN VIEWS ---
    path("campaigns/",                                  views.campaign_list_create,    name="campaign-list"),
    path("campaigns/public/<int:campaign_id>/",           views.campaign_public_detail,   name="campaign-public-detail"),
    path("campaigns/<int:campaign_id>/",                views.campaign_detail,         name="campaign-detail"),
    path("campaigns/<int:campaign_id>/approve/",        views.campaign_approve,        name="campaign-approve"),
    path("campaigns/<int:campaign_id>/deny/",           views.campaign_deny,           name="campaign-deny"),
    path("campaigns/<int:campaign_id>/toggle-active/",  views.campaign_toggle_active,  name="campaign-toggle-active"),
    path("campaigns/<int:campaign_id>/donate/",         views.campaign_donate,         name="campaign-donate"),
    path("campaigns/contributors/all/",                 views.campaign_all_contributors, name="campaign-all-contributors"),

    # --- ARTICLE / CMS VIEWS ---
    path("articles/",                           views.ArticleListCreate.as_view(),      name="article-list"),
    path("articles/published/",                 views.PublishedArticleList.as_view(),   name="published-article-list"),
    path("articles/published/<int:pk>/",        views.PublishedArticleDetail.as_view(), name="published-article-detail"),
    path("articles/delete/<int:pk>/",           views.ArticleDelete.as_view(),          name="delete-article"),
    path("articles/<int:article_id>/publish/",  views.publish_article,                 name="publish-article"),
    path("articles/<int:article_id>/deny/",     views.deny_article,                    name="deny-article"),
    path("articles/<int:article_id>/toggle-hide/", views.article_toggle_hide,          name="article-toggle-hide"),
    path("articles/<int:pk>/",                  views.ArticleDetailView.as_view(),      name="article-detail"),

    # --- DASHBOARD & SYSTEM ---
    path("dashboard/stats/",           views.dashboard_stats,                      name="dashboard-stats"),
    path("activities/",                ActivityLogListView.as_view(),               name="activity-list"),
    path("password-reset-request/",    views.request_password_reset,               name="password-reset-request"),
    path("password-reset-confirm/",    views.reset_password,                       name="password-reset-confirm"),
    path("token/",                     views.CustomTokenObtainPairView.as_view(),   name="token-obtain-pair"),
]