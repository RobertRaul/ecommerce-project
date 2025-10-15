from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificaciones"""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    type_icon = serializers.CharField(read_only=True)
    priority_color = serializers.CharField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'type_display', 'title', 'message', 
            'icon', 'type_icon', 'priority', 'priority_display',
            'priority_color', 'read', 'read_at', 'action_url',
            'order_id', 'product_id', 'user_id', 'metadata',
            'created_at', 'expires_at', 'is_expired', 'is_broadcast'
        ]
        read_only_fields = ['created_at', 'read_at']


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer para marcar notificaciones como leídas"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    mark_all = serializers.BooleanField(default=False)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer para preferencias de notificación"""
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'email_enabled', 'push_enabled', 'sms_enabled',
            'new_orders', 'order_updates', 'payment_updates',
            'stock_alerts', 'new_users', 'promotions', 'system_updates',
            'sound_enabled', 'sound_volume', 'quiet_hours_start',
            'quiet_hours_end', 'updated_at'
        ]
        read_only_fields = ['updated_at']


class CreateNotificationSerializer(serializers.ModelSerializer):
    """Serializer para crear notificaciones manualmente"""
    user_id = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Notification
        fields = [
            'user_id', 'type', 'title', 'message', 'icon', 'priority',
            'action_url', 'order_id', 'product_id', 'metadata',
            'expires_at', 'is_broadcast'
        ]
    
    def create(self, validated_data):
        from .utils import send_notification
        
        user_id = validated_data.pop('user_id', None)
        user = None
        
        if user_id:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise serializers.ValidationError("Usuario no encontrado")
        
        # Usar la utilidad para enviar notificación con WebSocket
        notification = send_notification(user=user, **validated_data)
        
        if not notification:
            raise serializers.ValidationError("Error al crear la notificación")
        
        return notification


class BroadcastNotificationSerializer(serializers.Serializer):
    """Serializer para enviar notificaciones broadcast"""
    title = serializers.CharField(max_length=255)
    message = serializers.CharField()
    type = serializers.ChoiceField(
        choices=['system', 'promotion'],
        default='system'
    )
    priority = serializers.ChoiceField(
        choices=['low', 'medium', 'high', 'urgent'],
        default='medium'
    )
    action_url = serializers.CharField(required=False, allow_blank=True)
    expires_in_hours = serializers.IntegerField(required=False, min_value=1, max_value=720)
    
    def create(self, validated_data):
        from .utils import send_notification
        from .models import NotificationType, NotificationPriority
        from django.utils import timezone
        from datetime import timedelta
        
        expires_at = None
        if 'expires_in_hours' in validated_data:
            expires_at = timezone.now() + timedelta(hours=validated_data['expires_in_hours'])
        
        type_map = {
            'system': NotificationType.SYSTEM,
            'promotion': NotificationType.PROMOTION
        }
        
        priority_map = {
            'low': NotificationPriority.LOW,
            'medium': NotificationPriority.MEDIUM,
            'high': NotificationPriority.HIGH,
            'urgent': NotificationPriority.URGENT
        }
        
        notification = send_notification(
            notification_type=type_map[validated_data['type']],
            title=validated_data['title'],
            message=validated_data['message'],
            priority=priority_map[validated_data['priority']],
            action_url=validated_data.get('action_url'),
            expires_at=expires_at,
            is_broadcast=True
        )
        
        return {'success': notification is not None, 'notification_id': notification.id if notification else None}
