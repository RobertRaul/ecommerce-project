from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView, ProfileView, ChangePasswordView, 
    logout_view,UserViewSet,LoginView
)

app_name = 'users'

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # ViewSet endpoints (CRUD completo)
    # GET    /api/auth/users/          - Listar usuarios
    # POST   /api/auth/users/          - Crear usuario
    # GET    /api/auth/users/{id}/     - Detalle de usuario
    # PUT    /api/auth/users/{id}/     - Actualizar usuario (completo)
    # PATCH  /api/auth/users/{id}/     - Actualizar usuario (parcial)
    # DELETE /api/auth/users/{id}/     - Eliminar usuario
    path('', include(router.urls)),

    # Autenticación
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Perfil
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
