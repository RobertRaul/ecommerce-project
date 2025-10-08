from django.urls import path
from .views import RegisterView, ProfileView, ChangePasswordView, logout_view

app_name = 'users'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('logout/', logout_view, name='logout'),
]