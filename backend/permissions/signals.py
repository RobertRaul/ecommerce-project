from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache
from .models import UserRole, RolePermission


@receiver(post_save, sender=UserRole)
@receiver(post_delete, sender=UserRole)
def invalidate_user_permissions_cache(sender, instance, **kwargs):
    """
    Invalidar cache de permisos cuando se actualiza el rol de un usuario
    """
    cache_key = f'user_permissions_{instance.user.id}'
    cache.delete(cache_key)


@receiver(post_save, sender=RolePermission)
@receiver(post_delete, sender=RolePermission)
def invalidate_role_permissions_cache(sender, instance, **kwargs):
    """
    Invalidar cache de todos los usuarios con ese rol
    """
    # Obtener todos los usuarios con ese rol
    user_roles = UserRole.objects.filter(role=instance.role, is_active=True)
    for user_role in user_roles:
        cache_key = f'user_permissions_{user_role.user.id}'
        cache.delete(cache_key)
