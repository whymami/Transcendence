from rest_framework.permissions import BasePermission

class IsAnonymousUser(BasePermission):
    def has_permission(self, request, view):
        print(request.user)
        return not request.user.is_authenticated
