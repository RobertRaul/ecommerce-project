from django.db import models
from django.conf import settings
from django.core.cache import cache


class Role(models.Model):
    """
    Roles del sistema con diferentes niveles de acceso
    """
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrador'),
        ('admin', 'Administrador'),
        ('inventory_manager', 'Gestor de Inventario'),
        ('order_manager', 'Gestor de Órdenes'),
        ('viewer', 'Visor'),
    ]

    name = models.CharField('Nombre', max_length=50, choices=ROLE_CHOICES, unique=True)
    display_name = models.CharField('Nombre para mostrar', max_length=100)
    description = models.TextField('Descripción', blank=True)
    is_active = models.BooleanField('Activo', default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['name']

    def __str__(self):
        return self.display_name

    def get_permissions_list(self):
        """Obtener lista de permisos del rol"""
        return list(self.permissions.filter(is_active=True).values_list('codename', flat=True))


class Permission(models.Model):
    """
    Permisos específicos que se pueden asignar a roles
    """
    # Categorías de permisos
    CATEGORY_CHOICES = [
        ('products', 'Productos'),
        ('orders', 'Órdenes'),
        ('customers', 'Clientes'),
        ('reports', 'Reportes'),
        ('settings', 'Configuración'),
        ('users', 'Usuarios'),
        ('coupons', 'Cupones'),
    ]

    # Acciones
    ACTION_CHOICES = [
        ('view', 'Ver'),
        ('create', 'Crear'),
        ('edit', 'Editar'),
        ('delete', 'Eliminar'),
        ('export', 'Exportar'),
        ('manage', 'Gestionar'),
    ]

    codename = models.CharField('Código', max_length=100, unique=True)
    name = models.CharField('Nombre', max_length=200)
    description = models.TextField('Descripción', blank=True)
    category = models.CharField('Categoría', max_length=50, choices=CATEGORY_CHOICES)
    action = models.CharField('Acción', max_length=50, choices=ACTION_CHOICES)
    is_active = models.BooleanField('Activo', default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Permiso'
        verbose_name_plural = 'Permisos'
        ordering = ['category', 'action']

    def __str__(self):
        return self.name


class RolePermission(models.Model):
    """
    Relación entre Roles y Permisos (muchos a muchos)
    """
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    granted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Permiso de Rol'
        verbose_name_plural = 'Permisos de Roles'
        unique_together = ['role', 'permission']

    def __str__(self):
        return f"{self.role.display_name} - {self.permission.name}"


class UserRole(models.Model):
    """
    Asignación de roles a usuarios
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='assigned_roles'
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField('Activo', default=True)

    class Meta:
        verbose_name = 'Rol de Usuario'
        verbose_name_plural = 'Roles de Usuarios'
        unique_together = ['user', 'role']

    def __str__(self):
        return f"{self.user.email} - {self.role.display_name}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Invalidar cache de permisos del usuario
        cache_key = f'user_permissions_{self.user.id}'
        cache.delete(cache_key)


class PermissionLog(models.Model):
    """
    Log de cambios en permisos para auditoría
    """
    ACTION_CHOICES = [
        ('grant', 'Otorgar'),
        ('revoke', 'Revocar'),
        ('create', 'Crear'),
        ('update', 'Actualizar'),
        ('delete', 'Eliminar'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='permission_logs')
    action = models.CharField('Acción', max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField('Tipo', max_length=50)  # 'role', 'permission', 'user_role'
    target_id = models.IntegerField('ID del objetivo')
    details = models.JSONField('Detalles', default=dict)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True,
        related_name='performed_permission_changes'
    )
    ip_address = models.GenericIPAddressField('IP', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Log de Permiso'
        verbose_name_plural = 'Logs de Permisos'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.action} - {self.created_at}"
