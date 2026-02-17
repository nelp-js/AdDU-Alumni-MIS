from django.urls import path
from . import views
from .views import ActivityLogListView

urlpatterns = [
    # --- USER VIEWS ---
    path("user/me/", views.current_user, name="current-user"),
    path("profile/", views.profile_detail, name="profile-detail"),
    path("profile/experiences/", views.ExperienceListCreate.as_view(), name="experience-list"),
    path("profile/experiences/<int:pk>/", views.ExperienceDetail.as_view(), name="experience-detail"),
    path("profile/educations/", views.EducationListCreate.as_view(), name="education-list"),
    path("profile/educations/<int:pk>/", views.EducationDetail.as_view(), name="education-detail"),
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user-detail"),
    path("users/<int:user_id>/approve/", views.approve_user, name="approve-user"),
    path("users/<int:user_id>/reject/", views.reject_user, name="reject-user"),
    path('users/pending-count/', views.pending_user_count, name='pending-user-count'),

    # --- EVENT VIEWS ---
    path("events/", views.EventListCreate.as_view(), name="event-list"),
    path("events/<int:pk>/", views.EventDetailView.as_view(), name="event-detail"),
    path("events/<int:event_id>/approve/", views.approve_event, name="approve-event"),
    path("events/<int:event_id>/reject/", views.reject_event, name="reject-event"),
    path("events/delete/<int:pk>/", views.EventDelete.as_view(), name="delete-event"),

    # --- ARTICLE / CMS VIEWS ---
    path("articles/", views.ArticleListCreate.as_view(), name="article-list"),
    path("articles/<int:pk>/", views.ArticleDetailView.as_view(), name="article-detail"),
    path("articles/<int:article_id>/publish/", views.publish_article, name="publish-article"),
    path("articles/delete/<int:pk>/", views.ArticleDelete.as_view(), name="delete-article"),
    
    # --- PUBLIC ARTICLE VIEWS (News Feed) ---
    path("articles/published/", views.PublishedArticleList.as_view(), name="published-article-list"),
    path("articles/published/<int:pk>/", views.PublishedArticleDetail.as_view(), name="published-article-detail"),

    # --- DASHBOARD STATS (The "Thick 1" Badge Logic) ---
    path("dashboard/stats/", views.dashboard_stats, name="dashboard-stats"),

    # --- SYSTEM VIEWS ---
    path('activities/', ActivityLogListView.as_view(), name='activity-list'),
    path("password-reset-request/", views.request_password_reset, name="password-reset-request"),
    path("password-reset-confirm/", views.reset_password, name="password-reset-confirm"),
]