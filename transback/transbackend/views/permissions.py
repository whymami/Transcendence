from rest_framework.permissions import BasePermission

class IsAnonymousUser(BasePermission):
    """
    This permission class allows access only to anonymous users.
    """
    def has_permission(self, request, view):
        print(request.user)
        return not request.user.is_authenticated
