from functools import wraps
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from rest_framework import status
from rest_framework.response import Response
from .utils import user_has_permission, user_has_any_permission, user_has_all_permissions, user_has_role


def permission_required(permission_codename):
    """
    Decorador para verificar si el usuario tiene un permiso específico
    Uso: @permission_required('products.create')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'No autenticado'},
                    status=401
                )

            if not user_has_permission(request.user, permission_codename):
                return JsonResponse(
                    {'error': f'No tienes permiso para: {permission_codename}'},
                    status=403
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def any_permission_required(*permission_codenames):
    """
    Decorador para verificar si el usuario tiene al menos uno de los permisos
    Uso: @any_permission_required('products.view', 'products.create')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'No autenticado'},
                    status=401
                )

            if not user_has_any_permission(request.user, permission_codenames):
                return JsonResponse(
                    {'error': 'No tienes los permisos necesarios'},
                    status=403
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def all_permissions_required(*permission_codenames):
    """
    Decorador para verificar si el usuario tiene todos los permisos
    Uso: @all_permissions_required('products.view', 'products.edit')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'No autenticado'},
                    status=401
                )

            if not user_has_all_permissions(request.user, permission_codenames):
                return JsonResponse(
                    {'error': 'No tienes todos los permisos necesarios'},
                    status=403
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def role_required(*role_names):
    """
    Decorador para verificar si el usuario tiene alguno de los roles
    Uso: @role_required('admin', 'inventory_manager')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'No autenticado'},
                    status=401
                )

            if not any(user_has_role(request.user, role) for role in role_names):
                return JsonResponse(
                    {'error': 'No tienes el rol necesario'},
                    status=403
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


# Decoradores para DRF ViewSets
class PermissionRequiredMixin:
    """
    Mixin para ViewSets de DRF que verifica permisos
    """
    permission_codename = None
    permission_map = {}  # {'list': 'view', 'create': 'create', ...}

    def check_permissions(self, request):
        super().check_permissions(request)

        if not request.user.is_authenticated:
            raise PermissionDenied('No autenticado')

        # Obtener el permiso requerido
        action = self.action
        if self.permission_map and action in self.permission_map:
            required_permission = self.permission_map[action]
        elif self.permission_codename:
            required_permission = self.permission_codename
        else:
            return  # No hay verificación de permisos

        # Verificar permiso
        if not user_has_permission(request.user, required_permission):
            raise PermissionDenied(f'No tienes permiso para: {required_permission}')


def api_permission_required(permission_codename):
    """
    Decorador para acciones específicas de ViewSets de DRF
    Uso: @api_permission_required('products.delete')
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(self, request, *args, **kwargs):
            if not request.user.is_authenticated:
                return Response(
                    {'error': 'No autenticado'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            if not user_has_permission(request.user, permission_codename):
                return Response(
                    {'error': f'No tienes permiso para: {permission_codename}'},
                    status=status.HTTP_403_FORBIDDEN
                )

            return view_func(self, request, *args, **kwargs)
        return wrapper
    return decorator
