"""Auth backends: alumni must be admin-approved (is_approved) to authenticate."""

from django.contrib.auth.backends import ModelBackend


class ApprovedAlumniAuthBackend(ModelBackend):
    """
    Same as ModelBackend, but non-staff users must have is_approved=True.
    This blocks login/token issuance even if only is_active is checked elsewhere.
    """

    def user_can_authenticate(self, user):
        if not super().user_can_authenticate(user):
            return False
        if getattr(user, "is_staff", False) or getattr(user, "is_superuser", False):
            return True
        return bool(getattr(user, "is_approved", False))
