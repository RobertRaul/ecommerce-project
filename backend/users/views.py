from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Q
from .serializers import (
    UserSerializer, RegisterSerializer,
    ChangePasswordSerializer, UpdateProfileSerializer,
    UserCreateSerializer, UserListSerializer, UserUpdateSerializer
)
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para gestión de usuarios
    - GET /api/auth/users/ - Listar usuarios
    - POST /api/auth/users/ - Crear usuario
    - GET /api/auth/users/{id}/ - Detalle de usuario
    - PUT/PATCH /api/auth/users/{id}/ - Actualizar usuario
    - DELETE /api/auth/users/{id}/ - Eliminar usuario
    """
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = [IsAdminUser, IsAuthenticated]

    def get_serializer_class(self):
        """Seleccionar serializer según la acción"""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        return UserListSerializer

    def get_queryset(self):
        """
        Filtrar usuarios según permisos y búsqueda
        """
        user = self.request.user
        queryset = super().get_queryset()

        # Si no es admin, solo ver su propio usuario
        if not (user.is_staff or user.is_superuser):
            return queryset.filter(id=user.id)

        # Búsqueda
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        return queryset

    def create(self, request, *args, **kwargs):
        """Crear nuevo usuario"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'message': 'Usuario creado exitosamente',
            'user': UserListSerializer(user).data
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Actualizar usuario completo (PUT)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        return Response({
            'message': 'Usuario actualizado exitosamente',
            'user': UserListSerializer(user).data
        })

    def partial_update(self, request, *args, **kwargs):
        """Actualizar usuario parcial (PATCH)"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Eliminar usuario"""
        instance = self.get_object()

        # No permitir eliminar superusuarios
        if instance.is_superuser:
            return Response({
                'error': 'No se puede eliminar un superusuario'
            }, status=status.HTTP_403_FORBIDDEN)

        self.perform_destroy(instance)
        return Response({
            'message': 'Usuario eliminado exitosamente'
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['GET'])
    def me(self, request):
        """
        GET /api/auth/users/me/
        Obtener información del usuario actual
        """
        serializer = UserListSerializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['POST'])
    def toggle_status(self, request, pk=None):
        """
        POST /api/auth/users/{id}/toggle_status/
        Activar/desactivar usuario
        """
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()

        return Response({
            'message': f'Usuario {"activado" if user.is_active else "desactivado"} exitosamente',
            'user': UserListSerializer(user).data
        })


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Registro de nuevos usuarios (público)
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET /api/auth/profile/ - Obtener perfil del usuario
    PUT/PATCH /api/auth/profile/ - Actualizar perfil
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateProfileSerializer
        return UserSerializer

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """
    PUT /api/auth/change-password/
    Cambiar contraseña del usuario autenticado
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Cambiar contraseña
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({
            'message': 'Contraseña actualizada exitosamente'
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    """
    POST /api/auth/login/
    Iniciar sesión
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({
                'detail': 'Email y contraseña son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Autenticar usuario
        user = authenticate(username=email, password=password)

        if user is None:
            return Response({
                'detail': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({
                'detail': 'Usuario inactivo'
            }, status=status.HTTP_403_FORBIDDEN)

        # Generar tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """
    POST /api/auth/logout/
    Cerrar sesión (blacklist refresh token)
    """
    try:
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response({
                'message': 'Sesión cerrada (sin token para invalidar)'
            }, status=status.HTTP_200_OK)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response({
                'message': 'Sesión cerrada exitosamente'
            }, status=status.HTTP_200_OK)

        except TokenError:
            return Response({
                'message': 'Sesión cerrada (token ya era inválido)'
            }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'message': 'Sesión cerrada'
        }, status=status.HTTP_200_OK)