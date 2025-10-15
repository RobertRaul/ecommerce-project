from django.contrib import admin
from .models import Role, Permission, RolePermission, UserRole, PermissionLog


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'display_name', 'description']
    ordering = ['name']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['name', 'codename', 'category', 'action', 'is_active']
    list_filter = ['category', 'action', 'is_active']
    search_fields = ['name', 'codename', 'description']
    ordering = ['category', 'action']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission', 'granted_at']
    list_filter = ['role', 'granted_at']
    search_fields = ['role__display_name', 'permission__name']
    autocomplete_fields = ['role', 'permission']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'is_active', 'assigned_by', 'assigned_at']
    list_filter = ['role', 'is_active', 'assigned_at']
    search_fields = ['user__email', 'user__username', 'role__display_name']
    autocomplete_fields = ['user', 'role', 'assigned_by']


@admin.register(PermissionLog)
class PermissionLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'target_type', 'performed_by', 'created_at']
    list_filter = ['action', 'target_type', 'created_at']
    search_fields = ['user__email', 'performed_by__email']
    readonly_fields = ['user', 'action', 'target_type', 'target_id', 'details', 'performed_by', 'ip_address', 'created_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
