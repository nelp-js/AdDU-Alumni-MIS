from django.shortcuts import render, get_object_or_404
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.db.models import Q, F
from django.core.paginator import Paginator
from urllib.parse import quote
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
import random
from django.core.mail import send_mail, EmailMultiAlternatives
from .models import (
    User, Event, EventRegistration, Job, Internship,
    VolunteerOpportunity, Campaign, CampaignDonation,
    Article, ActivityLog, PasswordReset, UserProfile, Experience, Education
)
from .serializers import (
    UserSerializer, CurrentUserSerializer, UserListSerializer, UserUpdateSerializer,
    EventSerializer, EventUpdateSerializer, EventRegistrationSerializer,
    JobSerializer, InternshipSerializer, VolunteerOpportunitySerializer,
    CampaignSerializer, CampaignDonationSerializer,
    CustomTokenObtainPairSerializer, ActivityLogSerializer,
    ArticleSerializer, ArticleUpdateSerializer,
    UserProfileSerializer, ExperienceSerializer, EducationSerializer,
    PublicAlumniListSerializer, PublicAlumniDetailSerializer,
)


# --- DASHBOARD STATS ---

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def dashboard_stats(request):
    pending_users       = User.objects.filter(is_approved=False, is_superuser=False).count()
    pending_events      = Event.objects.filter(status='pending').count()
    pending_articles    = Article.objects.filter(status='draft').count()
    pending_jobs        = Job.objects.filter(status='pending').count()
    pending_internships = Internship.objects.filter(status='pending').count()
    pending_volunteers  = VolunteerOpportunity.objects.filter(status='pending').count()
    pending_campaigns   = Campaign.objects.filter(status='pending').count()
    total = pending_users + pending_events + pending_articles + pending_jobs + pending_internships + pending_volunteers + pending_campaigns
    return Response({
        'total':        total,
        'users':        pending_users,
        'events':       pending_events,
        'articles':     pending_articles,
        'jobs':         pending_jobs,
        'internships':  pending_internships,
        'volunteers':   pending_volunteers,
        'campaigns':    pending_campaigns,
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def public_alumni_list(request):
    q = (request.GET.get('q') or '').strip()
    batch_year = (request.GET.get('batch_year') or '').strip()
    program = (request.GET.get('program') or '').strip()
    company = (request.GET.get('company') or '').strip()
    job_title = (request.GET.get('job_title') or '').strip()
    contact = (request.GET.get('contact') or '').strip()
    website = (request.GET.get('website') or '').strip()
    location = (request.GET.get('location') or '').strip()

    qs = User.objects.filter(
        is_active=True,
        is_approved=True,
        is_staff=False,
        is_superuser=False,
    ).select_related('profile').prefetch_related('experiences').order_by('first_name', 'last_name', 'username')

    if q:
        qs = qs.filter(
            Q(first_name__icontains=q)
            | Q(middle_name__icontains=q)
            | Q(last_name__icontains=q)
            | Q(username__icontains=q)
            | Q(program__icontains=q)
            | Q(batch_year__icontains=q)
            | Q(email__icontains=q)
            | Q(phone_number__icontains=q)
            | Q(telephone_number__icontains=q)
            | Q(profile__website__icontains=q)
            | Q(experiences__company_name__icontains=q)
            | Q(experiences__job_title__icontains=q)
        )

    if batch_year:
        qs = qs.filter(batch_year__icontains=batch_year)
    if program:
        qs = qs.filter(program__icontains=program)
    if company:
        qs = qs.filter(experiences__company_name__icontains=company)
    if job_title:
        qs = qs.filter(experiences__job_title__icontains=job_title)
    if contact:
        qs = qs.filter(
            Q(email__icontains=contact)
            | Q(phone_number__icontains=contact)
            | Q(telephone_number__icontains=contact)
        )
    if website:
        qs = qs.filter(profile__website__icontains=website)
    if location:
        qs = qs.filter(
            Q(profile__location__icontains=location)
            | Q(city__icontains=location)
            | Q(province__icontains=location)
            | Q(region__icontains=location)
        )
    qs = qs.distinct()

    return Response(PublicAlumniListSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def public_alumni_detail(request, user_id):
    user = get_object_or_404(
        User.objects.select_related('profile').prefetch_related('experiences', 'educations'),
        pk=user_id,
        is_active=True,
    )
    if not user.is_approved or user.is_staff or user.is_superuser:
        return Response({'detail': 'Not found.'}, status=404)
    return Response(PublicAlumniDetailSerializer(user).data)

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
        if user.is_anonymous: return Event.objects.filter(status='approved', is_hidden=False)
        if user.is_staff: return Event.objects.all()
        return Event.objects.filter(status='approved', is_hidden=False) | Event.objects.filter(organizer=user)
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
        return Event.objects.filter(status='approved', is_hidden=False)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def approve_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    event.status = 'approved'
    event.is_approved = True
    event.remarks = None
    event.save()
    ActivityLog.objects.create(action=f"Event approved: {event.event_name}", module="Event Management", user=request.user, status="Completed")
    return Response({"detail": "Event approved.", "status": "approved"})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def deny_event(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    event.status = 'denied'
    event.is_approved = False
    event.remarks = request.data.get('remarks', '')
    event.save()
    ActivityLog.objects.create(action=f"Event denied: {event.event_name}", module="Event Management", user=request.user, status="Denied")
    return Response({"detail": "Event denied.", "status": "denied"})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def reject_event(request, event_id):
    # Backwards-compatible alias
    return deny_event(request, event_id)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def event_toggle_hide(request, event_id):
    event = get_object_or_404(Event, pk=event_id)
    event.is_hidden = not event.is_hidden
    event.save()
    return Response({'detail': 'Updated.', 'is_hidden': event.is_hidden})

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
    event = get_object_or_404(Event, pk=event_id, status='approved', is_hidden=False)
    if EventRegistration.objects.filter(event=event, user=request.user).exists():
        return Response({'detail': 'You are already registered for this event.'}, status=400)
    serializer = EventRegistrationSerializer(data={**request.data, 'event': event.id})
    if serializer.is_valid():
        payment_method = (serializer.validated_data.get('payment_method') or '').strip().lower()
        if payment_method == 'gcash':
            payment_status = 'success'
        elif payment_method == 'maya':
            payment_status = 'pending'
        else:
            payment_status = 'failed'

        registration = serializer.save(user=request.user, event=event, payment_status=payment_status)

        if payment_status == 'success':
            qr_payload = (
                f"event={event.id}|registration={registration.id}|user={request.user.id}|"
                f"name={registration.first_name} {registration.last_name}|status=success"
            )
            qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=260x260&data={quote(qr_payload)}"
            subject = f"Event Registration Successful - {event.event_name}"
            text_body = (
                f"Hi {registration.first_name},\n\n"
                f"You are successfully registered for {event.event_name}.\n"
                f"Date: {event.start_date}\n"
                f"Venue: {event.venue}\n\n"
                f"Your QR code for entry:\n{qr_url}\n\n"
                "Please present this QR code at the event registration desk.\n\n"
                "Thank you."
            )
            html_body = f"""
                <p>Hi {registration.first_name},</p>
                <p>You are <strong>successfully registered</strong> for <strong>{event.event_name}</strong>.</p>
                <p><strong>Date:</strong> {event.start_date}<br><strong>Venue:</strong> {event.venue}</p>
                <p>Your QR code for entry:</p>
                <p><img src="{qr_url}" alt="Event QR Code" width="220" height="220" /></p>
                <p>Please present this QR code at the event registration desk.</p>
                <p>Thank you.</p>
            """
            email = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.EMAIL_HOST_USER,
                to=[request.user.email],
            )
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=True)

        detail_map = {
            'success': 'Successfully registered. A QR code has been sent to your email.',
            'pending': 'Registration submitted. Payment is pending.',
            'failed': 'Registration submitted but payment failed.',
        }
        return Response({
            **EventRegistrationSerializer(registration).data,
            'detail': detail_map.get(payment_status, 'Registration submitted.'),
        }, status=201)
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
    if new_status not in ['pending', 'success', 'failed']:
        return Response({'detail': 'Invalid status.'}, status=400)
    registration.payment_status = new_status; registration.save()
    return Response(EventRegistrationSerializer(registration).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_registrations(request):
    return Response(EventRegistrationSerializer(EventRegistration.objects.filter(user=request.user).select_related('event'), many=True).data)


# --- JOB VIEWS ---

def _safe_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _serialize_public_postings(request, queryset, serializer_class):
    query = (request.GET.get('q') or '').strip()
    location = (request.GET.get('location') or '').strip()
    modality = (request.GET.get('modality') or '').strip()
    ordering_key = (request.GET.get('ordering') or 'newest').strip().lower()

    if query:
        queryset = queryset.filter(
            Q(position__icontains=query)
            | Q(company__icontains=query)
            | Q(description__icontains=query)
            | Q(location__icontains=query)
        )
    if location:
        queryset = queryset.filter(location__icontains=location)
    if modality:
        queryset = queryset.filter(modality__iexact=modality)

    ordering_map = {
        'newest': '-created_at',
        'oldest': 'created_at',
        'position_asc': 'position',
        'company_asc': 'company',
    }
    queryset = queryset.order_by(ordering_map.get(ordering_key, '-created_at'))

    # Keep backward compatibility: plain list unless paging/filtering/sorting params are present.
    wants_paginated = any(
        key in request.GET for key in ('page', 'page_size', 'q', 'location', 'modality', 'ordering')
    )
    if not wants_paginated:
        return Response(serializer_class(queryset, many=True).data)

    page_size = max(1, min(50, _safe_int(request.GET.get('page_size'), 20)))
    page_num = max(1, _safe_int(request.GET.get('page'), 1))
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page_num)

    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'page_size': page_size,
        'results': serializer_class(page_obj.object_list, many=True).data,
    })


def _serialize_campaign_listing(request, queryset):
    query = (request.GET.get('q') or '').strip()
    category = (request.GET.get('category') or '').strip()
    ordering_key = (request.GET.get('ordering') or 'newest').strip().lower()

    if query:
        queryset = queryset.filter(
            Q(title__icontains=query)
            | Q(description__icontains=query)
            | Q(category__icontains=query)
        )
    if category:
        queryset = queryset.filter(category__iexact=category)

    ordering_map = {
        'newest': '-created_at',
        'oldest': 'created_at',
        'goal_desc': '-goal_amount',
        'raised_desc': '-raised_amount',
        'title_asc': 'title',
    }
    queryset = queryset.order_by(ordering_map.get(ordering_key, '-created_at'))

    # Backward compatibility for existing admin pages expecting plain arrays.
    wants_paginated = any(
        key in request.GET for key in ('page', 'page_size', 'q', 'category', 'ordering')
    )
    if not wants_paginated:
        return Response(CampaignSerializer(queryset, many=True).data)

    page_size = max(1, min(50, _safe_int(request.GET.get('page_size'), 12)))
    page_num = max(1, _safe_int(request.GET.get('page'), 1))
    paginator = Paginator(queryset, page_size)
    page_obj = paginator.get_page(page_num)

    return Response({
        'count': paginator.count,
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'page_size': page_size,
        'results': CampaignSerializer(page_obj.object_list, many=True).data,
    })

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def job_list_create(request):
    if request.method == 'GET':
        queryset = Job.objects.filter(status='approved', is_hidden=False)
        return _serialize_public_postings(request, queryset, JobSerializer)
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
        queryset = Internship.objects.filter(status='approved', is_hidden=False)
        return _serialize_public_postings(request, queryset, InternshipSerializer)
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


# --- VOLUNTEER VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def volunteer_list_create(request):
    if request.method == 'GET':
        admin_mode = str(request.GET.get('admin', '')).strip().lower() in ('1', 'true', 'yes')
        if request.user.is_authenticated and request.user.is_staff and admin_mode:
            volunteers = VolunteerOpportunity.objects.all()
        else:
            volunteers = VolunteerOpportunity.objects.filter(status='approved', is_hidden=False)
        return Response(VolunteerOpportunitySerializer(volunteers, many=True).data)

    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=403)

    serializer = VolunteerOpportunitySerializer(data=request.data)
    if serializer.is_valid():
        volunteer = serializer.save(created_by=request.user, status='pending', remarks=None, is_hidden=False)
        ActivityLog.objects.create(
            action=f"Volunteer opportunity submitted: {volunteer.title}",
            module="Volunteer",
            user=request.user,
            status="Pending",
        )
        return Response(VolunteerOpportunitySerializer(volunteer).data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def volunteer_admin_list(request):
    return Response(VolunteerOpportunitySerializer(VolunteerOpportunity.objects.all(), many=True).data)

@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsAdminUser])
def volunteer_detail(request, volunteer_id):
    volunteer = get_object_or_404(VolunteerOpportunity, pk=volunteer_id)
    if request.method == 'GET':
        return Response(VolunteerOpportunitySerializer(volunteer).data)
    if request.method == 'PATCH':
        serializer = VolunteerOpportunitySerializer(volunteer, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            ActivityLog.objects.create(action=f"Volunteer opportunity updated: {volunteer.title}", module="Volunteer", user=request.user, status="Completed")
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    title = volunteer.title
    volunteer.delete()
    ActivityLog.objects.create(action=f"Volunteer opportunity deleted: {title}", module="Volunteer", user=request.user, status="Completed")
    return Response(status=204)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def volunteer_approve(request, volunteer_id):
    volunteer = get_object_or_404(VolunteerOpportunity, pk=volunteer_id)
    volunteer.status = 'approved'
    volunteer.remarks = None
    volunteer.save()
    ActivityLog.objects.create(action=f"Volunteer opportunity approved: {volunteer.title}", module="Volunteer", user=request.user, status="Completed")
    return Response({'detail': 'Volunteer opportunity approved.', 'status': 'approved'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def volunteer_deny(request, volunteer_id):
    volunteer = get_object_or_404(VolunteerOpportunity, pk=volunteer_id)
    volunteer.status = 'denied'
    volunteer.remarks = request.data.get('remarks', '')
    volunteer.save()
    ActivityLog.objects.create(action=f"Volunteer opportunity denied: {volunteer.title}", module="Volunteer", user=request.user, status="Denied")
    return Response({'detail': 'Volunteer opportunity denied.', 'status': 'denied'})

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
def volunteer_toggle_hide(request, volunteer_id):
    volunteer = get_object_or_404(VolunteerOpportunity, pk=volunteer_id)
    volunteer.is_hidden = not volunteer.is_hidden
    volunteer.save()
    return Response({'detail': 'Updated.', 'is_hidden': volunteer.is_hidden})


# --- CAMPAIGN VIEWS ---

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def campaign_list_create(request):
    if request.method == 'GET':
        # Public listing defaults to approved + active only.
        # Admin dashboard can request all campaigns with admin=1.
        # Optional include_mine=1 lets non-admin users include their own entries.
        admin_mode = str(request.GET.get('admin', '')).strip().lower() in ('1', 'true', 'yes')
        include_mine = str(request.GET.get('include_mine', '')).strip().lower() in ('1', 'true', 'yes')
        if request.user.is_authenticated and request.user.is_staff and admin_mode:
            campaigns = Campaign.objects.all()
        elif request.user.is_authenticated and include_mine:
            campaigns = Campaign.objects.filter(
                Q(is_active=True, status='approved') | Q(created_by=request.user)
            ).distinct()
        else:
            campaigns = Campaign.objects.filter(is_active=True, status='approved')
        return _serialize_campaign_listing(request, campaigns)

    # POST — admin only
    if not request.user.is_staff:
        return Response({'detail': 'Admin access required.'}, status=403)
    serializer = CampaignSerializer(data=request.data)
    if serializer.is_valid():
        campaign = serializer.save(created_by=request.user, status='pending', remarks=None)
        ActivityLog.objects.create(action=f"Campaign submitted: {campaign.title}", module="Fundraising", user=request.user, status="Pending")
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
@permission_classes([IsAuthenticated, IsAdminUser])
def campaign_approve(request, campaign_id):
    campaign = get_object_or_404(Campaign, pk=campaign_id)
    campaign.status = 'approved'
    campaign.remarks = None
    campaign.save()
    ActivityLog.objects.create(action=f"Campaign approved: {campaign.title}", module="Fundraising", user=request.user, status="Completed")
    return Response({'detail': 'Campaign approved.', 'status': 'approved'})

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def campaign_deny(request, campaign_id):
    campaign = get_object_or_404(Campaign, pk=campaign_id)
    campaign.status = 'denied'
    campaign.remarks = request.data.get('remarks', '')
    campaign.save()
    ActivityLog.objects.create(action=f"Campaign denied: {campaign.title}", module="Fundraising", user=request.user, status="Denied")
    return Response({'detail': 'Campaign denied.', 'status': 'denied'})

@api_view(['POST'])
@permission_classes([AllowAny])
def campaign_donate(request, campaign_id):
    campaign = get_object_or_404(Campaign, pk=campaign_id, is_active=True, status='approved')

    method_raw = str(request.data.get('payment_method', '')).strip().lower()
    method_aliases = {
        'gcash': 'gcash',
        'maya': 'maya',
        'qrph': 'qrph',
        'credit/debit': 'credit_debit',
        'credit_debit': 'credit_debit',
        'credit or debit': 'credit_debit',
        'cash': 'cash',
        'cash (university cashier)': 'cash',
    }
    normalized_method = method_aliases.get(method_raw)
    if not normalized_method:
        return Response({'payment_method': ['Unsupported payment method.']}, status=400)

    if normalized_method in ('gcash', 'maya', 'cash'):
        payment_status = 'success'
    elif normalized_method == 'qrph':
        payment_status = 'pending'
    else:
        payment_status = 'failed'

    if request.user.is_authenticated:
        first_name = (request.user.first_name or '').strip() or 'User'
        last_name = (request.user.last_name or '').strip() or request.user.username
        email = (request.user.email or '').strip() or (request.data.get('email') or '').strip() or 'donor@example.com'
        donor_user = request.user
    else:
        first_name = (request.data.get('first_name') or '').strip() or 'Guest'
        last_name = (request.data.get('last_name') or '').strip() or 'Donor'
        email = (request.data.get('email') or '').strip() or 'guest@example.com'
        donor_user = None

    payload = {
        **request.data,
        'campaign': campaign.id,
        'payment_method': normalized_method,
        'first_name': first_name,
        'last_name': last_name,
        'email': email,
    }
    serializer = CampaignDonationSerializer(data=payload)
    if serializer.is_valid():
        with transaction.atomic():
            donation = serializer.save(user=donor_user, payment_status=payment_status)
            if payment_status == 'success':
                Campaign.objects.filter(pk=campaign.id).update(
                    raised_amount=F('raised_amount') + donation.amount,
                    donors_count=F('donors_count') + 1,
                )
            campaign.refresh_from_db(fields=['raised_amount', 'donors_count', 'goal_amount'])

        progress = 0
        if campaign.goal_amount and campaign.goal_amount > 0:
            progress = max(0, min(100, round((float(campaign.raised_amount) / float(campaign.goal_amount)) * 100)))

        ActivityLog.objects.create(
            action=f"Donation attempt ({payment_status}): ₱{donation.amount} for {campaign.title}",
            module="Fundraising",
            user=donor_user,
            status="Completed" if payment_status == 'success' else payment_status.title(),
        )
        return Response({
            **CampaignDonationSerializer(donation).data,
            'campaign_raised_amount': campaign.raised_amount,
            'campaign_donors_count': campaign.donors_count,
            'campaign_progress_percent': progress,
        }, status=201)
    return Response(serializer.errors, status=400)


# --- ARTICLE / CMS VIEWS ---

class ArticleListCreate(generics.ListCreateAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    parser_classes = (MultiPartParser, FormParser)
    def get_queryset(self): return Article.objects.all()
    def perform_create(self, serializer):
        article = serializer.save(
            created_by=self.request.user,
            status=Article.STATUS_DRAFT,
            remarks=None,
            approved_at=None,
            is_hidden=False,
        )
        ActivityLog.objects.create(
            action=f"Article submitted for approval: {article.title}",
            module="CMS & News Feed",
            user=self.request.user,
            status="Pending",
        )

class ArticleDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ArticleUpdateSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    queryset = Article.objects.all()
    parser_classes = (MultiPartParser, FormParser)

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def publish_article(request, article_id):
    article = get_object_or_404(Article, pk=article_id)
    article.status = 'published'
    article.remarks = None
    article.is_hidden = False
    article.approved_at = timezone.now()
    article.save()
    ActivityLog.objects.create(action=f"Article published: {article.title}", module="CMS & News Feed", user=request.user, status="Completed")
    return Response({"detail": "Article published.", "status": article.status})

@api_view(["POST"])
@permission_classes([IsAuthenticated, IsAdminUser])
def deny_article(request, article_id):
    article = get_object_or_404(Article, pk=article_id)
    article.status = 'denied'
    article.remarks = request.data.get('remarks', '')
    article.approved_at = None
    article.save()
    ActivityLog.objects.create(action=f"Article denied: {article.title}", module="CMS & News Feed", user=request.user, status="Denied")
    return Response({"detail": "Article denied.", "status": article.status})

@api_view(["PATCH"])
@permission_classes([IsAuthenticated, IsAdminUser])
def article_toggle_hide(request, article_id):
    article = get_object_or_404(Article, pk=article_id)
    article.is_hidden = not article.is_hidden
    article.save()
    return Response({"detail": "Updated.", "is_hidden": article.is_hidden})

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
    queryset = Article.objects.filter(status='published', is_hidden=False).order_by("-approved_at", "-created_at")

class PublishedArticleDetail(generics.RetrieveAPIView):
    serializer_class = ArticleSerializer
    permission_classes = [AllowAny]
    def get_queryset(self): return Article.objects.filter(status='published', is_hidden=False)

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