from django.urls import path
from .views import NotificationTestView

app_name = 'notifications'

urlpatterns = [
    path('test/', NotificationTestView.as_view(), name='test'),
]
