from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, ProfileView, ChangePasswordView, 
    logout_view, UserListViewSet
)

app_name = 'users'

router = DefaultRouter()
router.register(r'users', UserListViewSet, basename='user')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('logout/', logout_view, name='logout'),
    path('', include(router.urls)),
]
