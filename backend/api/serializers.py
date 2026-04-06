import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    User, Event, EventRegistration, Job, Internship,
    Campaign, CampaignDonation,
    Article, UserProfile, Experience, Education, ActivityLog
)


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "middle_name", "last_name", "email",
            "phone_number", "telephone_number", "current_address", "country", "geocode",
            "region", "province", "city", "religion", "religion_other",
            "marital_status", "marriage_date", "intend_to_marry", "intended_marriage_age", "no_marriage_reason",
            "course", "batch_year", "program", "batch",
            "is_active", "is_approved", "is_superuser", "is_staff", "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]
        extra_kwargs = {
            "middle_name":           {"required": False, "allow_blank": True, "allow_null": True},
            "telephone_number":      {"required": False, "allow_blank": True, "allow_null": True},
            "region":                {"required": False, "allow_blank": True, "allow_null": True},
            "province":              {"required": False, "allow_blank": True, "allow_null": True},
            "city":                  {"required": False, "allow_blank": True, "allow_null": True},
            "religion_other":        {"required": False, "allow_blank": True, "allow_null": True},
            "marriage_date":         {"required": False, "allow_blank": True, "allow_null": True},
            "intend_to_marry":       {"required": False, "allow_blank": True, "allow_null": True},
            "intended_marriage_age": {"required": False, "allow_null": True},
            "no_marriage_reason":    {"required": False, "allow_blank": True, "allow_null": True},
            "course":                {"required": False, "allow_blank": True, "allow_null": True},
            "batch_year":            {"required": False, "allow_null": True},
        }

    def update(self, instance, validated_data):
        if "course" in validated_data:
            validated_data["program"] = validated_data["course"]
        if "batch_year" in validated_data:
            validated_data["batch"] = validated_data["batch_year"]
        if validated_data.get("country", instance.country) != "Philippines":
            validated_data["region"] = validated_data["province"] = validated_data["city"] = None
        return super().update(instance, validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["is_superuser"] = user.is_superuser
        return token

    def validate(self, attrs):
        login_value = attrs.get("username", "").strip()
        if "@" in login_value:
            user = User.objects.filter(email__iexact=login_value).first()
            if user:
                attrs["username"] = user.username
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "password", "email",
            "first_name", "middle_name", "last_name", "name", "birth_date", "sex", "role",
            "phone_number", "telephone_number", "current_address", "country", "geocode",
            "region", "province", "city", "religion", "religion_other", "marital_status",
            "marriage_date", "intend_to_marry", "intended_marriage_age", "no_marriage_reason",
            "is_married", "maiden_name", "course", "batch_year", "has_diploma", "program", "batch",
            "id_type", "valid_id_file", "diploma_file", "valid_id",
        ]
        extra_kwargs = {
            "password":           {"write_only": True},
            "first_name":         {"required": True},
            "last_name":          {"required": True},
            "email":              {"required": True},
            "phone_number":       {"required": True},
            "country":            {"required": True},
            "geocode":            {"required": True},
            "id_type":            {"required": True},
            "middle_name":        {"required": False, "allow_blank": True},
            "telephone_number":   {"required": False, "allow_blank": True},
            "region":             {"required": False, "allow_blank": True},
            "province":           {"required": False, "allow_blank": True},
            "city":               {"required": False, "allow_blank": True},
            "religion_other":     {"required": False, "allow_blank": True},
            "marriage_date":      {"required": False, "allow_blank": True},
            "intend_to_marry":    {"required": False, "allow_blank": True},
            "no_marriage_reason": {"required": False, "allow_blank": True},
        }

    def validate(self, data):
        if len(data.get('password', '')) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
        country = data.get('country', '').lower()
        if country == 'philippines':
            if not data.get('region') or not data.get('province') or not data.get('city'):
                raise serializers.ValidationError("Region, Province, and City are required for the Philippines.")
        else:
            data['region'] = data['province'] = data['city'] = None
        marital_status = data.get('marital_status', '')
        if marital_status in ['married', 'separated', 'annulled', 'divorced', 'widowed']:
            if not data.get('marriage_date'):
                raise serializers.ValidationError({"marriage_date": "Marriage date is required for this status."})
            data['intend_to_marry'] = data['intended_marriage_age'] = data['no_marriage_reason'] = None
            data['is_married'] = marital_status == 'married'
        elif marital_status == 'single':
            data['marriage_date'] = None
            data['is_married'] = False
            data['maiden_name'] = None
        if data.get('religion') == 'other' and not data.get('religion_other'):
            raise serializers.ValidationError({"religion_other": "Please specify your religion."})
        if data.get('has_diploma') == 'yes' and not data.get('diploma_file'):
            raise serializers.ValidationError({"diploma_file": "Please upload your diploma."})
        elif data.get('has_diploma') == 'no':
            data['diploma_file'] = None
        if data.get('course'): data['program'] = data['course']
        if data.get('batch_year'): data['batch'] = data['batch_year']
        if not data.get('valid_id_file') and not data.get('valid_id'):
            raise serializers.ValidationError({"valid_id_file": "A valid ID document is required."})
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['is_approved'] = False
        validated_data['is_active'] = True
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "is_superuser",
            "first_name", "middle_name", "last_name", "email",
            "phone_number", "telephone_number", "current_address", "country", "geocode",
            "region", "province", "city", "birth_date", "sex",
            "religion", "religion_other", "marital_status", "marriage_date",
            "intend_to_marry", "intended_marriage_age", "no_marriage_reason",
            "course", "batch_year",
        ]
        read_only_fields = ["id", "username", "is_superuser", "email"]


class ExperienceSerializer(serializers.ModelSerializer):
    location        = serializers.CharField(required=False, allow_blank=True, default='')
    employment_type = serializers.CharField(required=False, allow_blank=True, default='')
    site_type       = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Experience
        fields = ["id", "job_title", "company_name", "website", "location",
                  "employment_type", "site_type", "start_date", "end_date", "description", "is_current"]
        read_only_fields = ["id"]

    def validate(self, data):
        if data.get('is_current'):
            data['end_date'] = None
        return data


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ["id", "school_name", "school_website", "school_logo_url", "degree",
                  "field_of_study", "start_month", "start_year", "end_month", "end_year",
                  "activities", "description"]
        read_only_fields = ["id"]


class UserProfileSerializer(serializers.ModelSerializer):
    experiences = ExperienceSerializer(many=True, read_only=True, source='user.experiences')
    educations  = EducationSerializer(many=True, read_only=True, source='user.educations')
    first_name  = serializers.CharField(source='user.first_name', required=False)
    middle_name = serializers.CharField(source='user.middle_name', required=False, allow_blank=True)
    last_name   = serializers.CharField(source='user.last_name', required=False)
    username    = serializers.CharField(source='user.username', read_only=True)
    email       = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ["id", "profile_picture", "cover_photo", "bio", "location", "website",
                  "first_name", "middle_name", "last_name", "username", "email",
                  "experiences", "educations"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "profile_picture": {"required": False}, "cover_photo": {"required": False},
            "bio": {"required": False}, "location": {"required": False}, "website": {"required": False},
        }


class UserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "middle_name", "last_name", "email",
            "phone_number", "telephone_number", "current_address", "country", "geocode",
            "region", "province", "city", "religion", "religion_other",
            "marital_status", "marriage_date", "intend_to_marry", "intended_marriage_age", "no_marriage_reason",
            "birth_date", "sex", "course", "batch_year", "program", "batch",
            "id_type", "valid_id_file", "diploma_file", "has_diploma",
            "is_active", "is_approved", "is_superuser", "is_staff", "date_joined",
        ]
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id", "event_name", "preview_text", "event_description",
            "start_date", "end_date", "start_time", "end_time",
            "venue", "category", "is_approved", "status", "remarks", "is_hidden", "organizer",
            "event_image", "cost", "organizer_names", "participants",
            "action_button_label", "action_button_link", "created_at", "updated_at",
        ]
        read_only_fields = ["is_approved", "organizer", "created_at", "updated_at"]


class EventUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id", "event_name", "preview_text", "event_description",
            "start_date", "end_date", "start_time", "end_time",
            "venue", "category", "is_approved", "status", "remarks", "is_hidden", "organizer",
            "event_image", "cost", "organizer_names", "participants",
            "action_button_label", "action_button_link", "created_at", "updated_at",
        ]
        read_only_fields = ["organizer", "created_at", "updated_at"]


class EventRegistrationSerializer(serializers.ModelSerializer):
    user_name  = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    event_name = serializers.CharField(source='event.event_name', read_only=True)

    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'event_name', 'user', 'user_name', 'user_email',
            'first_name', 'last_name', 'guest_count', 'guests',
            'payment_method', 'payment_status', 'total_amount', 'registered_at',
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_email', 'event_name', 'registered_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username

    def get_user_email(self, obj):
        return obj.user.email


class JobSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            'id', 'company', 'position', 'location', 'modality',
            'employment_type', 'salary', 'email', 'start_date', 'end_date', 'description',
            'status', 'remarks', 'is_hidden', 'posted_by', 'posted_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'posted_by', 'posted_by_name', 'created_at', 'updated_at']

    def get_posted_by_name(self, obj):
        return f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip() or obj.posted_by.username


class InternshipSerializer(serializers.ModelSerializer):
    posted_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Internship
        fields = [
            'id', 'company', 'position', 'location', 'modality',
            'allowance', 'email', 'start_date', 'end_date', 'description',
            'status', 'remarks', 'is_hidden', 'posted_by', 'posted_by_name', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'posted_by', 'posted_by_name', 'created_at', 'updated_at']

    def get_posted_by_name(self, obj):
        return f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip() or obj.posted_by.username


class CampaignDonationSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignDonation
        fields = ['id', 'campaign', 'first_name', 'last_name', 'email',
                  'amount', 'payment_method', 'donated_at']
        read_only_fields = ['id', 'donated_at']


class CampaignSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    donations_count = serializers.SerializerMethodField()

    class Meta:
        model = Campaign
        fields = [
            'id', 'title', 'description', 'category',
            'cover_image', 'image_url',
            'goal_amount', 'raised_amount', 'donors_count',
            'end_date', 'status', 'remarks', 'is_active',
            'created_by', 'created_by_name',
            'created_at', 'updated_at',
            'donations_count',
        ]
        read_only_fields = ['id', 'raised_amount', 'donors_count', 'created_by',
                            'created_by_name', 'created_at', 'updated_at', 'donations_count']

    def get_created_by_name(self, obj):
        if not obj.created_by: return '—'
        return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username

    def get_donations_count(self, obj):
        return obj.donations.count()


def _strip_html(text):
    if not text or not isinstance(text, str): return text or ""
    return " ".join(re.sub(r"<[^>]+>", "", text).split()).strip()

_FONT_STYLE_PROPS = frozenset(("font-family", "font-size", "font-weight", "font-style", "font", "color"))

def _strip_font_styles_from_html(html):
    if not html or not isinstance(html, str): return html or ""
    def clean_style(match):
        parts = [p for p in (p.strip() for p in match.group(1).split(";"))
                 if p and ":" in p and p.split(":", 1)[0].strip().lower() not in _FONT_STYLE_PROPS]
        return ' style="' + "; ".join(parts) + '"' if parts else ""
    html = re.sub(r'\s+style="([^"]*)"', clean_style, html)
    html = re.sub(r"\s+style='([^']*)'", clean_style, html)
    return html


class ArticleSerializer(serializers.ModelSerializer):
    content_created_time = serializers.DateTimeField(source="created_at", read_only=True)
    date_published       = serializers.DateTimeField(source="approved_at", read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "author_name", "subtitle", "cover_image", "content",
                  "status", "remarks", "is_hidden", "category", "is_featured", "created_by", "created_at",
                  "updated_at", "content_created_time", "approved_at", "date_published"]
        read_only_fields = ["created_by", "created_at", "updated_at", "content_created_time", "approved_at"]
        extra_kwargs = {
            "title": {"required": True}, "author_name": {"required": True},
            "subtitle": {"required": True}, "cover_image": {"required": True}, "category": {"required": True},
        }

    def validate_title(self, v):    return _strip_html(v)
    def validate_subtitle(self, v): return _strip_html(v)
    def validate_content(self, v):  return _strip_font_styles_from_html(v) if v else v


class ArticleUpdateSerializer(serializers.ModelSerializer):
    content_created_time = serializers.DateTimeField(source="created_at", read_only=True)
    date_published       = serializers.DateTimeField(source="approved_at", read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "author_name", "subtitle", "cover_image", "content",
                  "status", "remarks", "is_hidden", "category", "is_featured", "created_by", "created_at",
                  "updated_at", "content_created_time", "approved_at", "date_published"]
        read_only_fields = ["created_by", "created_at", "updated_at", "content_created_time", "approved_at"]
        extra_kwargs = {"title": {"required": True}, "author_name": {"required": True}, "subtitle": {"required": True}}

    def validate_title(self, v):    return _strip_html(v)
    def validate_subtitle(self, v): return _strip_html(v)
    def validate_content(self, v):  return _strip_font_styles_from_html(v) if v else v


class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()

    class Meta:
        model = ActivityLog
        fields = ['id', 'timestamp', 'action', 'module', 'user', 'status']