from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminUser(BasePermission):
    """
    Allows access only to staff/superuser accounts.
    """
    message = 'Admin privileges are required to access this resource.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class IsOwnerOrAdmin(BasePermission):
    """
    Object-level permission:
    - Admins can access any object.
    - Regular users can only access objects that belong to them.
    """
    message = 'You do not have permission to access this resource.'

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        # obj is a MemberProfile
        return obj.user == request.user
