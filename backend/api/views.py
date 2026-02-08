from django.shortcuts import render
from django.utils import timezone
from django.conf import settings  # 👈 Added this import for EMAIL_HOST_USER
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
import random
from django.core.mail import send_mail

from .models import User, Event, Article, ActivityLog, PasswordReset

from .serializers import (
    UserSerializer, CurrentUserSerializer, UserListSerializer, UserUpdateSerializer,
    EventSerializer, EventUpdateSerializer, CustomTokenObtainPairSerializer, ActivityLogSerializer,
    ArticleSerializer, ArticleUpdateSerializer,
)

# --- USER VIEWS ---
class CustomTokenObtainPairView(TokenObtainPairView):
    """Login view that issues JWT with is_superuser claim."""
    serializer_class = CustomTokenObtainPairSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return current user id, username, is_superuser for frontend (e.g. dashboard link)."""
    serializer = CurrentUserSerializer(request.user)
    return Response(serializer.data)


# 👇 NEW: Helper view for dashboard notifications
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_user_count(request):
    """Return the count of users waiting for approval."""
    # Assuming 'is_approved=False' and 'is_superuser=False' means pending
    count = User.objects.filter(is_approved=False, is_superuser=False).count()
    return Response({'count': count})


class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)


class UserListView(generics.ListAPIView):
    """List all registered users (admin only). Excludes superusers from list."""
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        return User.objects.filter(is_superuser=False).order_by("-date_joined")


class UserDetailView(generics.RetrieveUpdateAPIView):
    """GET or PATCH a user by id (admin only). Used for edit form."""
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = User.objects.all()


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_user(request, user_id):
    """Set user is_approved=True and is_active=True so they can log in (admin only)."""
    try:
        user = User.objects.get(pk=user_id, is_superuser=False)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)
    
    user.is_approved = True
    user.is_active = True
    user.save()

    # --- LOG ACTIVITY ---
    ActivityLog.objects.create(
        action=f"User approved: {user.username}",
        module="User Management",
        user=request.user,
        status="Completed"
    )

    return Response({"detail": "User approved.", "is_approved": True, "is_active": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_user(request, user_id):
    """Set user is_approved=False and is_active=False (admin only)."""
    try:
        user = User.objects.get(pk=user_id, is_superuser=False)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)
    
    user.is_approved = False
    user.is_active = False
    user.save()

    # --- LOG ACTIVITY ---
    ActivityLog.objects.create(
        action=f"User rejected: {user.username}",
        module="User Management",
        user=request.user,
        status="Rejected"
    )

    return Response({"detail": "User rejected.", "is_approved": False, "is_active": False})


# --- EVENT VIEWS ---
class EventListCreate(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous:
            return Event.objects.filter(is_approved=True)
        if user.is_staff:
            return Event.objects.all()
        return Event.objects.filter(is_approved=True) | Event.objects.filter(organizer=user)

    def perform_create(self, serializer):
        serializer.save(organizer=self.request.user)


class EventDetailView(generics.RetrieveUpdateAPIView):
    """GET: public (approved events only) or staff (any). PATCH: admin only."""
    serializer_class = EventUpdateSerializer
    parser_classes = (MultiPartParser, FormParser)

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return EventSerializer
        return EventUpdateSerializer

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Event.objects.all()
        return Event.objects.filter(is_approved=True)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_event(request, event_id):
    """Set event is_approved=True (admin only)."""
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"detail": "Event not found."}, status=404)
    event.is_approved = True
    event.save()
    ActivityLog.objects.create(
        action=f"Event approved: {event.event_name}",
        module="Event Management",
        user=request.user,
        status="Completed"
    )
    return Response({"detail": "Event approved.", "is_approved": True})


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_event(request, event_id):
    """Set event is_approved=False (admin only)."""
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"detail": "Event not found."}, status=404)
    event.is_approved = False
    event.save()
    ActivityLog.objects.create(
        action=f"Event rejected: {event.event_name}",
        module="Event Management",
        user=request.user,
        status="Rejected"
    )
    return Response({"detail": "Event rejected.", "is_approved": False})


class EventDelete(generics.DestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Event.objects.all()
        return Event.objects.filter(organizer=self.request.user)


# --- ARTICLE / CMS VIEWS ---
class ArticleListCreate(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)

    def get_queryset(self):
        return Article.objects.all()

    def perform_create(self, serializer):
        article = serializer.save(created_by=self.request.user)
        ActivityLog.objects.create(
            action=f"Article created: {article.title}",
            module="CMS & News Feed",
            user=self.request.user,
            status="Completed"
        )


class ArticleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ArticleUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Article.objects.all()
    parser_classes = (MultiPartParser, FormParser)


@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def publish_article(request, article_id):
    """Set article status to published and record approval time."""
    try:
        article = Article.objects.get(pk=article_id)
    except Article.DoesNotExist:
        return Response({"detail": "Article not found."}, status=404)
    article.status = Article.STATUS_PUBLISHED
    article.approved_at = timezone.now()
    article.save()
    ActivityLog.objects.create(
        action=f"Article published: {article.title}",
        module="CMS & News Feed",
        user=request.user,
        status="Completed"
    )
    return Response({"detail": "Article published.", "status": article.status})


class ArticleDelete(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Article.objects.all()

    def perform_destroy(self, instance):
        title = instance.title
        instance.delete()
        ActivityLog.objects.create(
            action=f"Article deleted: {title}",
            module="CMS & News Feed",
            user=self.request.user,
            status="Completed"
        )


# --- PUBLIC ARTICLE VIEWS (News & Stories page) ---
class PublishedArticleList(generics.ListAPIView):
    """List only published articles, newest first. No auth required."""
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    queryset = Article.objects.filter(status=Article.STATUS_PUBLISHED).order_by("-approved_at", "-created_at")


class PublishedArticleDetail(generics.RetrieveAPIView):
    """Get a single published article by id. 404 if not published. No auth required."""
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Article.objects.filter(status=Article.STATUS_PUBLISHED)


class ActivityLogListView(generics.ListAPIView):
    queryset = ActivityLog.objects.all()[:10]
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]


# --- PASSWORD RESET VIEWS (UPDATED) ---

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    username = request.data.get('username') 
    try:
        user = User.objects.get(username=username) 
        
        otp = str(random.randint(100000, 999999))
        
        # update_or_create ensures we don't make duplicate records for one user
        PasswordReset.objects.update_or_create(user=user, defaults={'otp': otp})
        
        # Send to the user's registered email
        send_mail(
            subject='Password Reset OTP - Ateneo Alumni',
            message=f'Your verification code is: {otp}',
            from_email=settings.EMAIL_HOST_USER,  # 👈 FIXED: Uses the verified sender email
            recipient_list=[user.email], 
            fail_silently=False,
        )
        return Response({"detail": f"OTP sent to email associated with {username}."})
    except User.DoesNotExist:
        return Response({"detail": "Username not found."}, status=404)
    except Exception as e:
        # Useful for debugging on Render logs
        print(f"Error sending email: {e}")
        return Response({"detail": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    username = request.data.get('username')
    otp = request.data.get('otp')
    new_password = request.data.get('password')
    
    try:
        user = User.objects.get(username=username)
        reset_entry = PasswordReset.objects.get(user=user)
        
        if reset_entry.otp == otp:
            user.set_password(new_password)
            user.save()
            reset_entry.delete()
            return Response({"detail": "Password reset successful."})
        else:
            return Response({"detail": "Invalid OTP."}, status=400)
            
    except (User.DoesNotExist, PasswordReset.DoesNotExist):
         return Response({"detail": "Invalid request or expired code."}, status=400)