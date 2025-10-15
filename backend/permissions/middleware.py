from .utils import get_user_permissions


class PermissionsMiddleware:
    """
    Middleware que agrega los permisos del usuario al request
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Agregar permisos al request si el usuario está autenticado
        if hasattr(request, 'user') and request.user.is_authenticated:
            request.user_permissions = get_user_permissions(request.user)
        else:
            request.user_permissions = []

        response = self.get_response(request)
        return response
