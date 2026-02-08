from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Event, Article
from .models import ActivityLog


class UserUpdateSerializer(serializers.ModelSerializer):
    """Admin edit: update user details and optionally set is_superuser / is_staff."""
    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "middle_name", "last_name",
            "email", "phone_number", "batch", "program", "date_joined",
            "is_active", "is_approved", "is_superuser", "is_staff"
        ]
        read_only_fields = ["id", "date_joined"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add is_superuser to JWT so frontend can show Dashboard without calling /api/user/me/."""
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["is_superuser"] = user.is_superuser
        return token


class UserSerializer(serializers.ModelSerializer):
    confirm_email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            "id", "first_name", "middle_name", "last_name", 
            "is_married", "maiden_name", "email", "confirm_email",
            "valid_id", "phone_number", "batch", "program",
            "username", "password"
        ]
        extra_kwargs = {
            "password": {"write_only": True},
            "first_name": {"required": True},
            "middle_name": {"required": False, "allow_blank": True},
            "last_name": {"required": True},
            "email": {"required": True},
            "phone_number": {"required": True},
            "batch": {"required": True},
            "program": {"required": True},
            "maiden_name": {"required": False},
            "valid_id": {"required": True},
        }

    def validate(self, data):
        if data.get('email') != data.get('confirm_email'):
            raise serializers.ValidationError({"confirm_email": "Email addresses do not match."})
        
        password = data.get('password', '')
        if len(password) < 8:
            raise serializers.ValidationError({"password": "Password must be at least 8 characters long."})
            
        if not data.get('is_married', False):
            data['maiden_name'] = None
        
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_email', None)
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
        fields = ["id", "username", "is_superuser", "first_name", "last_name", "email"]
        read_only_fields = ["id", "username", "is_superuser", "first_name", "last_name", "email"]


class UserListSerializer(serializers.ModelSerializer):
    """Admin list of registered users with date_joined (ISO for local TZ), is_approved, is_superuser, is_staff."""
    class Meta:
        model = User
        fields = [
            "id", "username", "first_name", "middle_name", "last_name",
            "email", "phone_number", "batch", "program", "date_joined",
            "is_active", "is_approved", "is_superuser", "is_staff"
        ]
        read_only_fields = fields


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id", "event_name", "preview_text", "event_description", # 👈 ADDED preview_text
            "start_date", "end_date", "start_time", "end_time", 
            "venue", "category", "is_approved", "organizer", 
            "event_image", "cost", "organizer_names", 
            "action_button_label", "action_button_link"
        ]
        read_only_fields = ["is_approved", "organizer"]


class EventUpdateSerializer(serializers.ModelSerializer):
    """Admin edit: update event fields including is_approved."""
    class Meta:
        model = Event
        fields = [
            "id", "event_name", "preview_text", "event_description", # 👈 ADDED preview_text
            "start_date", "end_date", "start_time", "end_time", 
            "venue", "category", "is_approved", "organizer", 
            "event_image", "cost", "organizer_names",
            "action_button_label", "action_button_link"
        ]
        read_only_fields = ["organizer"]


class ArticleSerializer(serializers.ModelSerializer):
    content_created_time = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "title", "author_name", "subtitle", "cover_image", "content",
            "status", "created_by", "created_at", "updated_at",
            "content_created_time", "approved_at"
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "content_created_time", "approved_at"]
        extra_kwargs = {
            "title": {"required": True},
            "author_name": {"required": True},
            "subtitle": {"required": True},
        }


class ArticleUpdateSerializer(serializers.ModelSerializer):
    """Admin edit article and publish."""
    content_created_time = serializers.DateTimeField(source="created_at", read_only=True)

    class Meta:
        model = Article
        fields = [
            "id", "title", "author_name", "subtitle", "cover_image", "content",
            "status", "created_by", "created_at", "updated_at",
            "content_created_time", "approved_at"
        ]
        read_only_fields = ["created_by", "created_at", "updated_at", "content_created_time", "approved_at"]
        extra_kwargs = {
            "title": {"required": True},
            "author_name": {"required": True},
            "subtitle": {"required": True},
        }


class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'timestamp', 'action', 'module', 'user', 'status']