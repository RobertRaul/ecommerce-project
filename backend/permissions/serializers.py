from rest_framework import serializers
from .models import Role, Permission, RolePermission, UserRole, PermissionLog
from django.contrib.auth import get_user_model

User = get_user_model()


class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'codename', 'name', 'description', 'category', 'action', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class RolePermissionSerializer(serializers.ModelSerializer):
    permission_details = PermissionSerializer(source='permission', read_only=True)

    class Meta:
        model = RolePermission
        fields = ['id', 'permission', 'permission_details', 'granted_at']


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SerializerMethodField()
    permission_count = serializers.SerializerMethodField()
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'name', 'display_name', 'description', 'is_active',
            'permissions', 'permission_count', 'user_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_permissions(self, obj):
        role_permissions = RolePermission.objects.filter(role=obj).select_related('permission')
        return [rp.permission.codename for rp in role_permissions]

    def get_permission_count(self, obj):
        return RolePermission.objects.filter(role=obj).count()

    def get_user_count(self, obj):
        return UserRole.objects.filter(role=obj, is_active=True).count()


class UserRoleSerializer(serializers.ModelSerializer):
    role_details = RoleSerializer(source='role', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    assigned_by_email = serializers.EmailField(source='assigned_by.email', read_only=True)

    class Meta:
        model = UserRole
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'role', 'role_details',
            'assigned_by', 'assigned_by_email',
            'assigned_at', 'is_active'
        ]
        read_only_fields = ['assigned_at']

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username


class AssignRoleSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role_id = serializers.IntegerField()

    def validate_user_id(self, value):
        try:
            User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("Usuario no encontrado")
        return value

    def validate_role_id(self, value):
        try:
            Role.objects.get(id=value, is_active=True)
        except Role.DoesNotExist:
            raise serializers.ValidationError("Rol no encontrado o inactivo")
        return value


class PermissionLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    performed_by_email = serializers.EmailField(source='performed_by.email', read_only=True)

    class Meta:
        model = PermissionLog
        fields = [
            'id', 'user', 'user_email', 'action', 'target_type', 'target_id',
            'details', 'performed_by', 'performed_by_email', 'ip_address', 'created_at'
        ]
        read_only_fields = fields


class UserPermissionsSerializer(serializers.Serializer):
    """Serializer para retornar permisos de un usuario"""
    user_id = serializers.IntegerField()
    email = serializers.EmailField()
    roles = serializers.ListField(child=serializers.CharField())
    permissions = serializers.ListField(child=serializers.CharField())
    is_superuser = serializers.BooleanField()
