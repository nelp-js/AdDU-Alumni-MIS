from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
import random
from django.core.mail import send_mail
from .models import (
    User, Event, EventRegistration, Job, Internship,
    Campaign, CampaignDonation,
    Article, ActivityLog, PasswordReset, UserProfile, Experience, Education
)
from .serializers import (
    UserSerializer, CurrentUserSerializer, UserListSerializer, UserUpdateSerializer,
    EventSerializer, EventUpdateSerializer, EventRegistrationSerializer,
    JobSerializer, InternshipSerializer,
    CampaignSerializer, CampaignDonationSerializer,
    CustomTokenObtainPairSerializer, ActivityLogSerializer,
    ArticleSerializer, ArticleUpdateSerializer,
    UserProfileSerializer, ExperienceSerializer, EducationSerializer,
)


# --- DASHBOARD STATS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_stats(request):
    pending_users       = User.objects.filter(is_approved=False, is_superuser=False).count()
    pending_events      = Event.objects.filter(is_approved=False).count()
    pending_articles    = Article.objects.filter(status='draft').count()
    pending_jobs        = Job.objects.filter(status='pending').count()
    pending_internships = Internship.objects.filter(status='pending').count()
    total = pending_users + pending_events + pending_articles + pending_jobs + pending_internships
    return Response({
        'total':        total,
        'users':        pending_users,
        'events':       pending_events,
        'articles':     pending_articles,
        'jobs':         pending_jobs,
        'internships':  pending_internships,
    })


# --- USER VIEWS ---

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def current_user(request):
    if request.method == "GET":
        return Response(CurrentUserSerializer(request.user).data)
    serializer = CurrentUserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=400)


# --- PROFILE VIEWS ---

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_detail(request):
    user = request.user
    profile, _ = UserProfile.objects.get_or_create(user=user, defaults={})
    if request.method == 'GET':
        return Response(UserProfileSerializer(profile).data)
    data = request.data
    if 'first_name' in data: user.first_name = data['first_name'] or ''
    if 'last_name'  in data: user.last_name  = data['last_name']  or ''
    user.save()
    for field in ['bio', 'location', 'website']:
        if field in data:
            setattr(profile, field, data[field] if data[field] not in (None, '') else '')
    if 'profile_picture' in request.FILES: profile.profile_picture = request.FILES['profile_picture']
    if 'cover_photo'     in request.FILES: profile.cover_photo     = request.FILES['cover_photo']
    profile.save()
    return Response(UserProfileSerializer(profile).data)


class ExperienceListCreate(generics.ListCreateAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Experience.objects.filter(user=self.request.user)
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class ExperienceDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExperienceSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Experience.objects.filter(user=self.request.user)

class EducationListCreate(generics.ListCreateAPIView):
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Education.objects.filter(user=self.request.user)
    def perform_create(self, serializer): serializer.save(user=self.request.user)

class EducationDetail(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = EducationSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self): return Education.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def pending_user_count(request):
    return Response({'count': User.objects.filter(is_approved=False, is_superuser=False).count()})

class CreateUserView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
    parser_classes = (MultiPartParser, FormParser)

class UserListView(generics.ListAPIView):
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    def get_queryset(self): return User.objects.filter(is_superuser=False).order_by("-date_joined")

class UserDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = User.objects.all()

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_user(request, user_id):
    user = get_object_or_404(User, pk=user_id, is_superuser=False)
    user.is_approved = True; user.is_active = True; user.save()
    try:
        send_mail('Welcome to Ateneo Alumni - Account Approved',
            f'Hi {user.first_name},\n\nYour account has been approved!\n\nLogin: http://addualumni.vervel.app/login',
            settings.EMAIL_HOST_USER, [user.email], fail_silently=False)
    except Exception as e: print(f"Email failed: {e}")
    ActivityLog.objects.create(action=f"User approved: {user.username}", module="User Management", user=request.user, status="Completed")
    return Response({"detail": "User approved.", "is_approved": True, "is_active": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_user(request, user_id):
    user = get_object_or_404(User, pk=user_id, is_superuser=False)
    user.is_approved = False; user.is_active = False; user.save()
    ActivityLog.objects.create(action=f"User rejected: {user.username}", module="User Management", user=request.user, status="Rejected")
    return Response({"detail": "User rejected.", "is_approved": False, "is_active": False})


# --- EVENT VIEWS ---

class EventListCreate(generics.ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)
    def get_queryset(self):
        user = self.request.user
        if user.is_anonymous: return Event.objects.filter(is_approved=True)
        if user.is_staff: return Event.objects.all()
        return Event.objects.filter(is_approved=True) | Event.objects.filter(organizer=user)
    def perform_create(self, serializer): serializer.save(organizer=self.request.user)

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
        if self.request.user.is_authenticated and self.request.user.is_staff: return Event.objects.all()
        return Event.objects.filter(is_approved=True)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    event.is_approved = True; event.save()
    ActivityLog.objects.create(action=f"Event approved: {event.event_name}", module="Event Management", user=request.user, status="Completed")
    return Response({"detail": "Event approved.", "is_approved": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    event.is_approved = False; event.save()
    ActivityLog.objects.create(action=f"Event rejected: {event.event_name}", module="Event Management", user=request.user, status="Rejected")
    return Response({"detail": "Event rejected.", "is_approved": False})

class EventDelete(generics.DestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        if self.request.user.is_staff: return Event.objects.all()
        return Event.objects.filter(organizer=self.request.user)


# --- EVENT REGISTRATION VIEWS ---

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_for_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id, is_approved=True)
    if EventRegistration.objects.filter(event=event, user=request.user).exists():
        return Response({'detail': 'You are already registered for this event.'}, status=400)
    serializer = EventRegistrationSerializer(data={**request.data, 'event': event.id})
    if serializer.is_valid():
        serializer.save(user=request.user, event=event, payment_status='pending')
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def event_registrations(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    return Response(EventRegistrationSerializer(EventRegistration.objects.filter(event=event), many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def all_registrations(request):
    return Response(EventRegistrationSerializer(EventRegistration.objects.select_related('event', 'user').all(), many=True).data)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def update_registration_status(request, registration_id):
    registration = get_object_or_404(EventRegistration, pk=registration_id)
    new_status = request.data.get('payment_status')
    if new_status not in ['pending', 'paid', 'cancelled']:
        return Response({'detail': 'Invalid status.'}, status=400)
    registration.payment_status = new_status; registration.save()
    return Response(EventRegistrationSerializer(registration).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_registrations(request):
    return Response(EventRegistrationSerializer(EventRegistration.objects.filter(user=request.user).select_related('event'), many=True).data)


# --- JOB VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def job_list_create(request):
    if request.method == 'GET':
        return Response(JobSerializer(Job.objects.filter(status='approved', is_hidden=False), many=True).data)
    serializer = JobSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(posted_by=request.user, status='pending')
        ActivityLog.objects.create(action=f"Job submitted: {request.data.get('position', '')} at {request.data.get('company', '')}", module="Job & Internship", user=request.user, status="Pending")
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def job_admin_list(request):
    return Response(JobSerializer(Job.objects.all(), many=True).data)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def job_detail(request, job_id):
    job = get_object_or_404(Job, pk=job_id)
    if request.method == 'GET': return Response(JobSerializer(job).data)
    if request.method == 'PATCH':
        serializer = JobSerializer(job, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    job.delete()
    return Response(status=204)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def job_approve(request, job_id):
    job = get_object_or_404(Job, pk=job_id)
    job.status = 'approved'; job.remarks = None; job.save()
    ActivityLog.objects.create(action=f"Job approved: {job.position} at {job.company}", module="Job & Internship", user=request.user, status="Completed")
    return Response({'detail': 'Job approved.', 'status': 'approved'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def job_deny(request, job_id):
    job = get_object_or_404(Job, pk=job_id)
    job.status = 'denied'; job.remarks = request.data.get('remarks', ''); job.save()
    ActivityLog.objects.create(action=f"Job denied: {job.position} at {job.company}", module="Job & Internship", user=request.user, status="Denied")
    return Response({'detail': 'Job denied.', 'status': 'denied'})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def job_toggle_hide(request, job_id):
    job = get_object_or_404(Job, pk=job_id)
    job.is_hidden = not job.is_hidden; job.save()
    return Response({'detail': 'Updated.', 'is_hidden': job.is_hidden})


# --- INTERNSHIP VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def internship_list_create(request):
    if request.method == 'GET':
        return Response(InternshipSerializer(Internship.objects.filter(status='approved', is_hidden=False), many=True).data)
    serializer = InternshipSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(posted_by=request.user, status='pending')
        ActivityLog.objects.create(action=f"Internship submitted: {request.data.get('position', '')} at {request.data.get('company', '')}", module="Job & Internship", user=request.user, status="Pending")
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def internship_admin_list(request):
    return Response(InternshipSerializer(Internship.objects.all(), many=True).data)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def internship_detail(request, internship_id):
    internship = get_object_or_404(Internship, pk=internship_id)
    if request.method == 'GET': return Response(InternshipSerializer(internship).data)
    if request.method == 'PATCH':
        serializer = InternshipSerializer(internship, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    internship.delete()
    return Response(status=204)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def internship_approve(request, internship_id):
    internship = get_object_or_404(Internship, pk=internship_id)
    internship.status = 'approved'; internship.remarks = None; internship.save()
    ActivityLog.objects.create(action=f"Internship approved: {internship.position} at {internship.company}", module="Job & Internship", user=request.user, status="Completed")
    return Response({'detail': 'Internship approved.', 'status': 'approved'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def internship_deny(request, internship_id):
    internship = get_object_or_404(Internship, pk=internship_id)
    internship.status = 'denied'; internship.remarks = request.data.get('remarks', ''); internship.save()
    ActivityLog.objects.create(action=f"Internship denied: {internship.position} at {internship.company}", module="Job & Internship", user=request.user, status="Denied")
    return Response({'detail': 'Internship denied.', 'status': 'denied'})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def internship_toggle_hide(request, internship_id):
    internship = get_object_or_404(Internship, pk=internship_id)
    internship.is_hidden = not internship.is_hidden; internship.save()
    return Response({'detail': 'Updated.', 'is_hidden': internship.is_hidden})


# --- CAMPAIGN VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def campaign_list_create(request):
    if request.method == 'GET':
        # Admins see all, public sees only active
        if request.user.is_authenticated and request.user.is_staff:
            campaigns = Campaign.objects.all()
        else:
            campaigns = Campaign.objects.filter(is_active=True)
        return Response(CampaignSerializer(campaigns, many=True).data)

    # POST — admin only
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=403)
    serializer = CampaignSerializer(data=request.data)
    if serializer.is_valid():
        campaign = serializer.save(created_by=request.user)
        ActivityLog.objects.create(action=f"Campaign created: {campaign.title}", module="Fundraising", user=request.user, status="Completed")
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def campaign_detail(request, campaign_id):
    campaign = get_object_or_404(Campaign, pk=campaign_id)
    if request.method == 'GET':
        return Response(CampaignSerializer(campaign).data)
    if request.method in ('PUT', 'PATCH'):
        serializer = CampaignSerializer(campaign, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            ActivityLog.objects.create(action=f"Campaign updated: {campaign.title}", module="Fundraising", user=request.user, status="Completed")
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    # DELETE
    title = campaign.title
    campaign.delete()
    ActivityLog.objects.create(action=f"Campaign deleted: {title}", module="Fundraising", user=request.user, status="Completed")
    return Response(status=204)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def campaign_toggle_active(request, campaign_id):
    campaign = get_object_or_404(Campaign, pk=campaign_id)
    campaign.is_active = not campaign.is_active
    campaign.save()
    action = "shown" if campaign.is_active else "hidden"
    ActivityLog.objects.create(action=f"Campaign {action}: {campaign.title}", module="Fundraising", user=request.user, status="Completed")
    return Response({'detail': f'Campaign {action}.', 'is_active': campaign.is_active})

@api_view(['POST'])
@permission_classes([AllowAny])
def campaign_donate(request, campaign_id):
    campaign = get_object_or_404(Campaign, pk=campaign_id, is_active=True)
    serializer = CampaignDonationSerializer(data={**request.data, 'campaign': campaign.id})
    if serializer.is_valid():
        donation = serializer.save()
        campaign.raised_amount += donation.amount
        campaign.donors_count  += 1
        campaign.save()
        ActivityLog.objects.create(
            action=f"Donation received: ₱{donation.amount} for {campaign.title}",
            module="Fundraising",
            user=request.user if request.user.is_authenticated else None,
            status="Completed"
        )
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)


# --- ARTICLE / CMS VIEWS ---

class ArticleListCreate(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    def get_queryset(self): return Article.objects.all()
    def perform_create(self, serializer):
        article = serializer.save(created_by=self.request.user)
        ActivityLog.objects.create(action=f"Article created: {article.title}", module="CMS & News Feed", user=self.request.user, status="Completed")

class ArticleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ArticleUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Article.objects.all()
    parser_classes = (MultiPartParser, FormParser)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def publish_article(request, article_id):
    article = get_object_or_404(Article, pk=article_id)
    article.status = 'published'; article.approved_at = timezone.now(); article.save()
    ActivityLog.objects.create(action=f"Article published: {article.title}", module="CMS & News Feed", user=request.user, status="Completed")
    return Response({"detail": "Article published.", "status": article.status})

class ArticleDelete(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Article.objects.all()
    def perform_destroy(self, instance):
        title = instance.title; instance.delete()
        ActivityLog.objects.create(action=f"Article deleted: {title}", module="CMS & News Feed", user=self.request.user, status="Completed")


# --- PUBLIC VIEWS & PASSWORD RESET ---

class PublishedArticleList(generics.ListAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    queryset = Article.objects.filter(status='published').order_by("-approved_at", "-created_at")

class PublishedArticleDetail(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    def get_queryset(self): return Article.objects.filter(status='published')

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
        send_mail('Password Reset OTP', f'Your code is: {otp}', settings.EMAIL_HOST_USER, [user.email], fail_silently=False)
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
            user.set_password(new_password); user.save(); reset_entry.delete()
            return Response({"detail": "Success."})
        return Response({"detail": "Invalid OTP."}, status=400)
    except:
        return Response({"detail": "Invalid request."}, status=400)