from django.shortcuts import render
from django.utils import timezone
from django.conf import settings
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

# --- SYSTEM WIDE STATS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_stats(request):
    """
    Returns the dynamic total for the dashboard notification badge.
    Sum of: Pending Users + Pending Events + Draft Articles.
    """
    # 1. Users waiting for approval
    pending_users = User.objects.filter(is_approved=False, is_superuser=False).count()
    
    # 2. Events waiting for approval
    pending_events = Event.objects.filter(is_approved=False).count()
    
    # 3. Articles still in 'draft' status (from your ContentManagement.jsx logic)
    # Note: We use the lowercase 'draft' to match your frontend status checks
    pending_articles = Article.objects.filter(status='draft').count()
    
    # The total for your "Thick" Badge
    total_notifications = pending_users + pending_events + pending_articles

    return Response({
        'total': total_notifications,
        'users': pending_users,
        'events': pending_events,
        'articles': pending_articles
    })


# --- USER VIEWS ---

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def current_user(request):
    serializer = CurrentUserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_user_count(request):
    count = User.objects.filter(is_approved=False, is_superuser=False).count()
    return Response({'count': count})

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get_queryset(self):
        return User.objects.filter(is_superuser=False).order_by("-date_joined")

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = User.objects.all()

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id, is_superuser=False)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)
    user.is_approved = True
    user.is_active = True
    user.save()
    ActivityLog.objects.create(
        action=f"User approved: {user.username}",
        module="User Management",
        user=request.user, status="Completed"
    )
    return Response({"detail": "User approved.", "is_approved": True, "is_active": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id, is_superuser=False)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)
    user.is_approved = False
    user.is_active = False
    user.save()
    ActivityLog.objects.create(
        action=f"User rejected: {user.username}",
        module="User Management",
        user=request.user, status="Rejected"
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
    serializer_class = EventUpdateSerializer
    parser_classes = (MultiPartParser, FormParser)
    def get_permissions(self):
        if self.request.method == "GET": return [AllowAny()]
        return [IsAuthenticated(), IsAdminUser()]
    def get_serializer_class(self):
        if self.request.method == "GET": return EventSerializer
        return EventUpdateSerializer
    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return Event.objects.all()
        return Event.objects.filter(is_approved=True)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_event(request, event_id):
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"detail": "Event not found."}, status=404)
    event.is_approved = True
    event.save()
    ActivityLog.objects.create(
        action=f"Event approved: {event.event_name}",
        module="Event Management",
        user=request.user, status="Completed"
    )
    return Response({"detail": "Event approved.", "is_approved": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_event(request, event_id):
    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        return Response({"detail": "Event not found."}, status=404)
    event.is_approved = False
    event.save()
    ActivityLog.objects.create(
        action=f"Event rejected: {event.event_name}",
        module="Event Management",
        user=request.user, status="Rejected"
    )
    return Response({"detail": "Event rejected.", "is_approved": False})

class EventDelete(generics.DestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff: return Event.objects.all()
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
            user=self.request.user, status="Completed"
        )

class ArticleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ArticleUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Article.objects.all()
    parser_classes = (MultiPartParser, FormParser)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def publish_article(request, article_id):
    try:
        article = Article.objects.get(pk=article_id)
    except Article.DoesNotExist:
        return Response({"detail": "Article not found."}, status=404)
    article.status = 'published' # Matches your React status check
    article.approved_at = timezone.now()
    article.save()
    ActivityLog.objects.create(
        action=f"Article published: {article.title}",
        module="CMS & News Feed",
        user=request.user, status="Completed"
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
            user=self.request.user, status="Completed"
        )


# --- PUBLIC VIEWS & PASSWORD RESET ---

class PublishedArticleList(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    queryset = Article.objects.filter(status='published').order_by("-approved_at", "-created_at")

class PublishedArticleDetail(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    def get_queryset(self):
        return Article.objects.filter(status='published')

class ActivityLogListView(generics.ListAPIView):
    queryset = ActivityLog.objects.all()[:10]
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset(request):
    username = request.data.get('username') 
    try:
        user = User.objects.get(username=username) 
        otp = str(random.randint(100000, 999999))
        PasswordReset.objects.update_or_create(user=user, defaults={'otp': otp})
        send_mail(
            subject='Password Reset OTP',
            message=f'Your code is: {otp}',
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[user.email], 
            fail_silently=False,
        )
        return Response({"detail": f"OTP sent to {username}."})
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)

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
            return Response({"detail": "Success."})
        return Response({"detail": "Invalid OTP."}, status=400)
    except:
         return Response({"detail": "Invalid request."}, status=400)