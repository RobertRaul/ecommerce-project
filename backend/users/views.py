from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    UserSerializer, RegisterSerializer,
    ChangePasswordSerializer, UpdateProfileSerializer
)
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    Registro de nuevos usuarios
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
            # Token ya inválido, expirado o en blacklist
            return Response({
                'message': 'Sesión cerrada (token ya era inválido)'
            }, status=status.HTTP_200_OK)

    except Exception as e:
        # Cualquier otro error - no fallar el logout
        return Response({
            'message': f'Sesión cerrada'
        }, status=status.HTTP_200_OK)

class LoginView(APIView):
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

        # Generar tokens
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
