from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth import get_user_model
from django.db import transaction

from .models import Role, Permission, RolePermission, UserRole, PermissionLog
from .serializers import (
    RoleSerializer, PermissionSerializer, RolePermissionSerializer,
    UserRoleSerializer, PermissionLogSerializer, AssignRoleSerializer,
    UserPermissionsSerializer
)
from .utils import (
    get_user_permissions, assign_role_to_user, 
    revoke_role_from_user, get_user_roles
)

User = get_user_model()


class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de roles
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['get'])
    def permissions(self, request, pk=None):
        """Obtener permisos de un rol"""
        role = self.get_object()
        role_permissions = RolePermission.objects.filter(role=role).select_related('permission')
        serializer = RolePermissionSerializer(role_permissions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def assign_permission(self, request, pk=None):
        """Asignar un permiso a un rol"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')

        try:
            permission = Permission.objects.get(id=permission_id, is_active=True)
            
            role_permission, created = RolePermission.objects.get_or_create(
                role=role,
                permission=permission
            )

            if created:
                # Log
                PermissionLog.objects.create(
                    user=request.user,
                    action='grant',
                    target_type='role_permission',
                    target_id=role_permission.id,
                    details={'role': role.name, 'permission': permission.codename},
                    performed_by=request.user,
                    ip_address=request.META.get('REMOTE_ADDR')
                )

                return Response({'message': 'Permiso asignado exitosamente'}, status=status.HTTP_201_CREATED)
            else:
                return Response({'message': 'El permiso ya estaba asignado'}, status=status.HTTP_200_OK)

        except Permission.DoesNotExist:
            return Response({'error': 'Permiso no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def revoke_permission(self, request, pk=None):
        """Revocar un permiso de un rol"""
        role = self.get_object()
        permission_id = request.data.get('permission_id')

        try:
            permission = Permission.objects.get(id=permission_id)
            role_permission = RolePermission.objects.get(role=role, permission=permission)
            
            # Log antes de eliminar
            PermissionLog.objects.create(
                user=request.user,
                action='revoke',
                target_type='role_permission',
                target_id=role_permission.id,
                details={'role': role.name, 'permission': permission.codename},
                performed_by=request.user,
                ip_address=request.META.get('REMOTE_ADDR')
            )

            role_permission.delete()

            return Response({'message': 'Permiso revocado exitosamente'})

        except (Permission.DoesNotExist, RolePermission.DoesNotExist):
            return Response({'error': 'Permiso no encontrado'}, status=status.HTTP_404_NOT_FOUND)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar permisos disponibles
    """
    queryset = Permission.objects.filter(is_active=True)
    serializer_class = PermissionSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Obtener permisos agrupados por categoría"""
        categories = Permission.CATEGORY_CHOICES
        result = {}

        for category_code, category_name in categories:
            permissions = Permission.objects.filter(
                category=category_code,
                is_active=True
            )
            result[category_code] = {
                'name': category_name,
                'permissions': PermissionSerializer(permissions, many=True).data
            }

        return Response(result)


class UserRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de roles de usuarios
    """
    queryset = UserRole.objects.select_related('user', 'role', 'assigned_by')
    serializer_class = UserRoleSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        user_id = self.request.query_params.get('user_id')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset

    @action(detail=False, methods=['post'])
    def assign_role(self, request):
        """Asignar un rol a un usuario"""
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(id=serializer.validated_data['user_id'])
        role = Role.objects.get(id=serializer.validated_data['role_id'])

        user_role = assign_role_to_user(user, role, request.user)

        return Response({
            'message': 'Rol asignado exitosamente',
            'user_role': UserRoleSerializer(user_role).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def revoke_role(self, request):
        """Revocar un rol de un usuario"""
        serializer = AssignRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.get(id=serializer.validated_data['user_id'])
        role = Role.objects.get(id=serializer.validated_data['role_id'])

        success = revoke_role_from_user(user, role, request.user)

        if success:
            return Response({'message': 'Rol revocado exitosamente'})
        else:
            return Response({'error': 'El usuario no tiene ese rol'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def user_permissions(self, request):
        """Obtener permisos de un usuario específico"""
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response({'error': 'user_id requerido'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            permissions = get_user_permissions(user)
            roles = list(get_user_roles(user))

            data = {
                'user_id': user.id,
                'email': user.email,
                'roles': roles,
                'permissions': permissions,
                'is_superuser': user.is_superuser
            }

            serializer = UserPermissionsSerializer(data)
            return Response(serializer.data)

        except User.DoesNotExist:
            return Response({'error': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def my_permissions(self, request):
        """Obtener permisos del usuario autenticado"""
        permissions = get_user_permissions(request.user)
        roles = list(get_user_roles(request.user))

        data = {
            'user_id': request.user.id,
            'email': request.user.email,
            'roles': roles,
            'permissions': permissions,
            'is_superuser': request.user.is_superuser
        }

        serializer = UserPermissionsSerializer(data)
        return Response(serializer.data)


class PermissionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para ver logs de permisos (auditoría)
    """
    queryset = PermissionLog.objects.select_related('user', 'performed_by')
    serializer_class = PermissionLogSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        user_id = self.request.query_params.get('user_id')
        action = self.request.query_params.get('action')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if action:
            queryset = queryset.filter(action=action)
            
        return queryset.order_by('-created_at')
