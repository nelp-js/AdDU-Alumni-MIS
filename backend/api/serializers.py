import re
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Event, Article, UserProfile, Experience, Education
from .models import ActivityLog


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            # Identity
            "id", "username", "first_name", "middle_name", "last_name", "email",

            # Contact & Address
            "phone_number", "telephone_number",
            "current_address", "country", "geocode",
            "region", "province", "city",

            # Background
            "religion", "religion_other",
            "marital_status", "marriage_date",
            "intend_to_marry", "intended_marriage_age", "no_marriage_reason",

            # Academic (new fields + legacy fields kept in sync)
            "course", "batch_year",
            "program", "batch",

            # Role & Status
            "is_active", "is_approved", "is_superuser", "is_staff",

            # Meta (read-only)
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]
        extra_kwargs = {
            "middle_name":          {"required": False, "allow_blank": True, "allow_null": True},
            "telephone_number":     {"required": False, "allow_blank": True, "allow_null": True},
            "region":               {"required": False, "allow_blank": True, "allow_null": True},
            "province":             {"required": False, "allow_blank": True, "allow_null": True},
            "city":                 {"required": False, "allow_blank": True, "allow_null": True},
            "religion_other":       {"required": False, "allow_blank": True, "allow_null": True},
            "marriage_date":        {"required": False, "allow_blank": True, "allow_null": True},
            "intend_to_marry":      {"required": False, "allow_blank": True, "allow_null": True},
            "intended_marriage_age":{"required": False, "allow_null": True},
            "no_marriage_reason":   {"required": False, "allow_blank": True, "allow_null": True},
            "course":               {"required": False, "allow_blank": True, "allow_null": True},
            "batch_year":           {"required": False, "allow_null": True},
        }

    def update(self, instance, validated_data):
        # Keep legacy fields (batch, program) in sync with new fields (batch_year, course)
        if "course" in validated_data:
            validated_data["program"] = validated_data["course"]
        if "batch_year" in validated_data:
            validated_data["batch"] = validated_data["batch_year"]

        # Wipe location sub-fields if country is not Philippines
        if validated_data.get("country", instance.country) != "Philippines":
            validated_data["region"]   = None
            validated_data["province"] = None
            validated_data["city"]     = None

        return super().update(instance, validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add is_superuser to JWT. Allow login with username OR email."""
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
            
            # Personal Info
            "first_name", "middle_name", "last_name", "name", 
            "birth_date", "sex", "role",
            
            # Contact & Location
            "phone_number", "telephone_number", "current_address", 
            "country", "geocode", "region", "province", "city",
            
            # Civil Status
            "religion", "religion_other", "marital_status", 
            "marriage_date", "intend_to_marry", "intended_marriage_age", 
            "no_marriage_reason",
            
            # Legacy Civil Status (Kept for backwards compatibility)
            "is_married", "maiden_name",
            
            # Academic Info
            "course", "batch_year", "has_diploma", 
            "program", "batch",
            
            # Documents
            "id_type", "valid_id_file", "diploma_file",
            "valid_id"
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "first_name": {"required": True},
            "last_name": {"required": True},
            "email": {"required": True},
            "phone_number": {"required": True},
            "country": {"required": True},
            "geocode": {"required": True},
            "id_type": {"required": True},
            # Allow blank for conditional fields
            "middle_name": {"required": False, "allow_blank": True},
            "telephone_number": {"required": False, "allow_blank": True},
            "region": {"required": False, "allow_blank": True},
            "province": {"required": False, "allow_blank": True},
            "city": {"required": False, "allow_blank": True},
            "religion_other": {"required": False, "allow_blank": True},
            "marriage_date": {"required": False, "allow_blank": True},
            "intend_to_marry": {"required": False, "allow_blank": True},
            "no_marriage_reason": {"required": False, "allow_blank": True},
        }

    def validate(self, data):
        # 1. Password Validation
        password = data.get('password', '')
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})

        # 2. Location Validation
        country = data.get('country', '').lower()
        if country == 'philippines':
            if not data.get('region') or not data.get('province') or not data.get('city'):
                raise serializers.ValidationError("Region, Province, and City are required for the Philippines.")
        else:
            # Wipe local fields if country is not Philippines
            data['region'] = None
            data['province'] = None
            data['city'] = None

        # 3. Civil Status Validation
        marital_status = data.get('marital_status', '')
        if marital_status in ['married', 'separated', 'annulled', 'divorced', 'widowed']:
            if not data.get('marriage_date'):
                raise serializers.ValidationError({"marriage_date": "Marriage date is required for this status."})
            # Wipe single-only fields
            data['intend_to_marry'] = None
            data['intended_marriage_age'] = None
            data['no_marriage_reason'] = None
            # Update legacy field
            data['is_married'] = True if marital_status == 'married' else False
        elif marital_status == 'single':
            # Wipe marriage date
            data['marriage_date'] = None
            data['is_married'] = False
            data['maiden_name'] = None

        # 4. Religion Validation
        if data.get('religion') == 'other' and not data.get('religion_other'):
             raise serializers.ValidationError({"religion_other": "Please specify your religion."})

        # 5. Diploma Validation
        if data.get('has_diploma') == 'yes' and not data.get('diploma_file'):
            raise serializers.ValidationError({"diploma_file": "Please upload your diploma."})
        elif data.get('has_diploma') == 'no':
            data['diploma_file'] = None

        # 6. Legacy Academic Fields Mapping
        # To ensure nothing breaks, we map the new frontend fields back to the old database columns
        if data.get('course'):
            data['program'] = data.get('course')
        if data.get('batch_year'):
            data['batch'] = data.get('batch_year')

        # 7. Document Required Check
        if not data.get('valid_id_file') and not data.get('valid_id'):
            raise serializers.ValidationError({"valid_id_file": "A valid ID document is required."})

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # New users are always pending approval
        validated_data['is_approved'] = False 
        validated_data['is_active'] = True  
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CurrentUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "is_superuser", "first_name", "middle_name", "last_name", "email"]
        read_only_fields = ["id", "username", "is_superuser", "first_name", "last_name", "email"]


class ExperienceSerializer(serializers.ModelSerializer):
    location = serializers.CharField(required=False, allow_blank=True, default='')
    employment_type = serializers.CharField(required=False, allow_blank=True, default='')
    site_type = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = Experience
        fields = ["id", "job_title", "company_name", "website", "location", "employment_type", "site_type", "start_date", "end_date", "description", "is_current"]
        read_only_fields = ["id"]

    def validate(self, data):
        """When is_current is True, end_date must be null."""
        if data.get('is_current'):
            data['end_date'] = None
        return data


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = ["id", "school_name", "school_website", "school_logo_url", "degree", "field_of_study", "start_month", "start_year", "end_month", "end_year", "activities", "description"]
        read_only_fields = ["id"]


class UserProfileSerializer(serializers.ModelSerializer):
    experiences = ExperienceSerializer(many=True, read_only=True, source='user.experiences')
    educations = EducationSerializer(many=True, read_only=True, source='user.educations')
    first_name = serializers.CharField(source='user.first_name', required=False)
    middle_name = serializers.CharField(source='user.middle_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id", "profile_picture", "cover_photo", "bio", "location", "website",
            "first_name", "middle_name", "last_name", "username", "email",
            "experiences", "educations"
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "profile_picture": {"required": False},
            "cover_photo": {"required": False},
            "bio": {"required": False},
            "location": {"required": False},
            "website": {"required": False},
        }


class UserListSerializer(serializers.ModelSerializer):
    """Admin list of registered users — returns all fields needed by the frontend."""
    class Meta:
        model = User
        fields = [
            # Identity
            "id", "username", "first_name", "middle_name", "last_name", "email",

            # Contact & Address
            "phone_number", "telephone_number",
            "current_address", "country", "geocode",
            "region", "province", "city",

            # Background
            "religion", "religion_other",
            "marital_status", "marriage_date",
            "intend_to_marry", "intended_marriage_age", "no_marriage_reason",

            # Personal
            "birth_date", "sex",

            # Academic
            "course", "batch_year",
            "program", "batch",

            # Documents
            "id_type", "valid_id_file", "diploma_file", "has_diploma",

            # Role & Status
            "is_active", "is_approved", "is_superuser", "is_staff",

            # Meta
            "date_joined",
        ]
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id", "event_name", "preview_text", "event_description",
            "start_date", "end_date", "start_time", "end_time",
            "venue", "category", "is_approved", "organizer",
            "event_image", "cost", "organizer_names",
            "participants",
            "action_button_label", "action_button_link",
            "created_at", "updated_at",
        ]
        read_only_fields = ["is_approved", "organizer", "created_at", "updated_at"]


class EventUpdateSerializer(serializers.ModelSerializer):
    """Admin edit: update event fields including is_approved."""
    class Meta:
        model = Event
        fields = [
            "id", "event_name", "preview_text", "event_description",
            "start_date", "end_date", "start_time", "end_time",
            "venue", "category", "is_approved", "organizer",
            "event_image", "cost", "organizer_names",
            "participants",
            "action_button_label", "action_button_link",
            "created_at", "updated_at",
        ]
        read_only_fields = ["organizer", "created_at", "updated_at"]


def _strip_html(text):
    """Strip HTML tags and normalize whitespace for title/subtitle uniformity."""
    if not text or not isinstance(text, str):
        return text or ""
    cleaned = re.sub(r"<[^>]+>", "", text)
    return " ".join(cleaned.split()).strip()

_FONT_STYLE_PROPS = frozenset(
    ("font-family", "font-size", "font-weight", "font-style", "font", "color")
)


def _strip_font_styles_from_html(html):
    """Remove font-family, font-size, font-weight, color from inline styles in HTML content."""
    if not html or not isinstance(html, str):
        return html or ""

    def clean_style(match):
        style = match.group(1)
        if not style.strip():
            return ""
        parts = []
        for part in style.split(";"):
            part = part.strip()
            if not part or ":" not in part:
                continue
            prop, _ = part.split(":", 1)
            prop_lower = prop.strip().lower()
            if prop_lower in _FONT_STYLE_PROPS:
                continue
            parts.append(part)
        if not parts:
            return ""
        return ' style="' + "; ".join(parts) + '"'

    # Match both style="..." and style='...'
    html = re.sub(r'\s+style="([^"]*)"', clean_style, html)
    html = re.sub(r"\s+style='([^']*)'", clean_style, html)
    return html


class ArticleSerializer(serializers.ModelSerializer):
    content_created_time = serializers.DateTimeField(source="created_at", read_only=True)
    date_published = serializers.DateTimeField(source="approved_at", read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "title", "author_name", "subtitle", "cover_image", "content",
            "status", "category", "is_featured", "created_by", "created_at", 
            "updated_at", "content_created_time", "approved_at", "date_published"
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "content_created_time", "approved_at"]
        extra_kwargs = {
            "title": {"required": True},
            "author_name": {"required": True},
            "subtitle": {"required": True},
            "cover_image": {"required": True},
            "category": {"required": True},
        }

    def validate_title(self, value):
        return _strip_html(value)

    def validate_subtitle(self, value):
        return _strip_html(value)

    def validate_content(self, value):
        return _strip_font_styles_from_html(value) if value else value


class ArticleUpdateSerializer(serializers.ModelSerializer):
    """Admin edit article and publish."""
    content_created_time = serializers.DateTimeField(source="created_at", read_only=True)
    date_published = serializers.DateTimeField(source="approved_at", read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "title", "author_name", "subtitle", "cover_image", "content",
            "status", "category", "is_featured", "created_by", "created_at", 
            "updated_at", "content_created_time", "approved_at", "date_published"
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "content_created_time", "approved_at"]
        extra_kwargs = {
            "title": {"required": True},
            "author_name": {"required": True},
            "subtitle": {"required": True},
        }

    def validate_title(self, value):
        return _strip_html(value)

    def validate_subtitle(self, value):
        return _strip_html(value)

    def validate_content(self, value):
        return _strip_font_styles_from_html(value) if value else value


class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'timestamp', 'action', 'module', 'user', 'status']