"""JWT auth: reject access tokens for alumni who are not yet admin-approved."""

from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed


class ApprovedAlumniJWTAuthentication(JWTAuthentication):
    """
    After validating the token, ensure pending alumni cannot use protected APIs
    (tokens issued before approval checks were added, or edge paths).
    """

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user.is_staff or user.is_superuser:
            return user
        if not getattr(user, "is_approved", False):
            raise AuthenticationFailed(
                "Your registration is still pending admin approval. "
                "You will have access after an administrator approves your account."
            )
        return user
