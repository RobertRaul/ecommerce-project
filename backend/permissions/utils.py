from django.core.cache import cache
from django.contrib.auth import get_user_model
from .models import UserRole, Permission

User = get_user_model()


def get_user_permissions(user):
    """
    Obtener todos los permisos de un usuario (con cache)
    """
    if not user or not user.is_authenticated:
        return []

    # Superusuario tiene todos los permisos
    if user.is_superuser:
        return list(Permission.objects.filter(is_active=True).values_list('codename', flat=True))

    # Verificar cache
    cache_key = f'user_permissions_{user.id}'
    permissions = cache.get(cache_key)

    if permissions is None:
        # Obtener permisos de todos los roles activos del usuario
        user_roles = UserRole.objects.filter(
            user=user,
            is_active=True,
            role__is_active=True
        ).select_related('role')

        permissions = set()
        for user_role in user_roles:
            role_permissions = user_role.role.get_permissions_list()
            permissions.update(role_permissions)

        permissions = list(permissions)

        # Cachear por 1 hora
        cache.set(cache_key, permissions, 60 * 60)

    return permissions


def user_has_permission(user, permission_codename):
    """
    Verificar si un usuario tiene un permiso específico
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    user_permissions = get_user_permissions(user)
    return permission_codename in user_permissions


def user_has_any_permission(user, permission_codenames):
    """
    Verificar si un usuario tiene al menos uno de los permisos
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    user_permissions = get_user_permissions(user)
    return any(perm in user_permissions for perm in permission_codenames)


def user_has_all_permissions(user, permission_codenames):
    """
    Verificar si un usuario tiene todos los permisos especificados
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser:
        return True

    user_permissions = get_user_permissions(user)
    return all(perm in user_permissions for perm in permission_codenames)


def get_user_roles(user):
    """
    Obtener roles de un usuario
    """
    if not user or not user.is_authenticated:
        return []

    return UserRole.objects.filter(
        user=user,
        is_active=True
    ).select_related('role').values_list('role__name', flat=True)


def user_has_role(user, role_name):
    """
    Verificar si un usuario tiene un rol específico
    """
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser and role_name == 'super_admin':
        return True

    return UserRole.objects.filter(
        user=user,
        role__name=role_name,
        is_active=True
    ).exists()


def assign_role_to_user(user, role, assigned_by=None):
    """
    Asignar un rol a un usuario
    """
    from .models import UserRole, PermissionLog

    user_role, created = UserRole.objects.get_or_create(
        user=user,
        role=role,
        defaults={'assigned_by': assigned_by}
    )

    if not created and not user_role.is_active:
        user_role.is_active = True
        user_role.save()

    # Log
    PermissionLog.objects.create(
        user=user,
        action='grant',
        target_type='user_role',
        target_id=user_role.id,
        details={'role': role.name},
        performed_by=assigned_by
    )

    return user_role


def revoke_role_from_user(user, role, performed_by=None):
    """
    Revocar un rol de un usuario
    """
    from .models import PermissionLog

    try:
        user_role = UserRole.objects.get(user=user, role=role)
        user_role.is_active = False
        user_role.save()

        # Log
        PermissionLog.objects.create(
            user=user,
            action='revoke',
            target_type='user_role',
            target_id=user_role.id,
            details={'role': role.name},
            performed_by=performed_by
        )

        return True
    except UserRole.DoesNotExist:
        return False
