from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from .models import Notification, NotificationType, NotificationPriority
from .serializers import NotificationSerializer, BroadcastNotificationSerializer
from .utils import send_notification

User = get_user_model()


class NotificationTestView(LoginRequiredMixin, TemplateView):
    """Vista para probar WebSocket de notificaciones"""
    template_name = 'test_notifications.html'
    login_url = '/admin/login/'


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar notificaciones de usuarios.
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Obtener solo las notificaciones del usuario actual"""
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'broadcast':
            return BroadcastNotificationSerializer
        return super().get_serializer_class()
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Obtener notificaciones no leídas"""
        notifications = self.get_queryset().filter(read=False)
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def count_unread(self, request):
        """Contador de notificaciones no leídas"""
        count = self.get_queryset().filter(read=False).count()
        return Response({'count': count})
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Marcar notificación como leída"""
        notification = self.get_object()
        notification.read = True
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Marcar todas las notificaciones como leídas"""
        updated = self.get_queryset().filter(read=False).update(
            read=True,
            read_at=timezone.now()
        )
        return Response({
            'message': f'{updated} notificaciones marcadas como leídas',
            'count': updated
        })
    
    @action(detail=True, methods=['delete'])
    def dismiss(self, request, pk=None):
        """Eliminar una notificación"""
        notification = self.get_object()
        notification.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Eliminar todas las notificaciones del usuario"""
        deleted = self.get_queryset().delete()
        return Response({
            'message': f'{deleted[0]} notificaciones eliminadas',
            'count': deleted[0]
        })
    
    @action(detail=False, methods=['post'])
    def broadcast(self, request):
        """Enviar notificación broadcast a todos los usuarios (solo admin)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'No tienes permiso para enviar notificaciones broadcast'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        
        return Response(result, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Obtener estadísticas de notificaciones (solo admin)"""
        if not request.user.is_staff:
            return Response(
                {'error': 'No tienes permiso para ver estadísticas'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from datetime import timedelta
        from django.db.models import Count
        
        now = timezone.now()
        last_24h = now - timedelta(hours=24)
        last_7d = now - timedelta(days=7)
        last_30d = now - timedelta(days=30)
        
        stats = {
            'total_notifications': Notification.objects.count(),
            'total_unread': Notification.objects.filter(read=False).count(),
            'last_24h': Notification.objects.filter(created_at__gte=last_24h).count(),
            'last_7d': Notification.objects.filter(created_at__gte=last_7d).count(),
            'last_30d': Notification.objects.filter(created_at__gte=last_30d).count(),
            'by_type': dict(
                Notification.objects.values_list('type').annotate(
                    count=Count('id')
                )
            ),
            'by_priority': dict(
                Notification.objects.values_list('priority').annotate(
                    count=Count('id')
                )
            ),
            'active_users': Notification.objects.filter(
                created_at__gte=last_7d
            ).values('user').distinct().count()
        }
        
        return Response(stats)
    
    @action(detail=False, methods=['post'])
    def test_notification(self, request):
        """Enviar notificación de prueba"""
        notification = send_notification(
            user=request.user,
            notification_type=NotificationType.SYSTEM,
            title="Notificación de Prueba",
            message="Esta es una notificación de prueba del sistema",
            priority=NotificationPriority.LOW,
            metadata={
                'test': True,
                'timestamp': timezone.now().isoformat()
            }
        )
        
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
