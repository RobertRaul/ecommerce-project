import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async
import logging

logger = logging.getLogger(__name__)


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer para notificaciones en tiempo real"""
    
    async def connect(self):
        """Conectar usuario al WebSocket"""
        # Obtener el usuario de la sesión
        self.user = self.scope["user"]
        
        # Solo permitir conexiones de usuarios autenticados o crear grupo público
        if self.user.is_authenticated:
            # Canal personal del usuario
            self.user_group_name = f'notifications_user_{self.user.id}'
            
            # Añadir el canal al grupo del usuario
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            
            # Si es admin, añadir al grupo de admins
            if await self.is_admin():
                self.admin_group_name = 'notifications_admins'
                await self.channel_layer.group_add(
                    self.admin_group_name,
                    self.channel_name
                )
            
            logger.info(f"Usuario {self.user.username} conectado a WebSocket")
        else:
            # Canal público para notificaciones generales
            self.user_group_name = 'notifications_public'
            await self.channel_layer.group_add(
                self.user_group_name,
                self.channel_name
            )
            logger.info("Usuario anónimo conectado a WebSocket público")
        
        # Aceptar la conexión WebSocket
        await self.accept()
        
        # Enviar mensaje de bienvenida
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Conectado al sistema de notificaciones',
            'user': self.user.username if self.user.is_authenticated else 'anonymous'
        }))
        
        # Enviar notificaciones no leídas si es usuario autenticado
        if self.user.is_authenticated:
            await self.send_unread_notifications()

    async def disconnect(self, close_code):
        """Desconectar usuario del WebSocket"""
        # Remover el canal del grupo
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
        
        # Si es admin, remover del grupo de admins
        if hasattr(self, 'admin_group_name'):
            await self.channel_layer.group_discard(
                self.admin_group_name,
                self.channel_name
            )
        
        logger.info(f"Usuario desconectado del WebSocket: {close_code}")

    async def receive(self, text_data):
        """Recibir mensaje del cliente WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            # Manejar diferentes tipos de mensajes
            if message_type == 'ping':
                # Responder con pong para mantener conexión viva
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            
            elif message_type == 'mark_as_read':
                # Marcar notificación como leída
                notification_id = data.get('notification_id')
                if notification_id and self.user.is_authenticated:
                    await self.mark_notification_as_read(notification_id)
            
            elif message_type == 'mark_all_as_read':
                # Marcar todas las notificaciones como leídas
                if self.user.is_authenticated:
                    await self.mark_all_notifications_as_read()
            
            elif message_type == 'get_unread_count':
                # Obtener cantidad de notificaciones no leídas
                if self.user.is_authenticated:
                    count = await self.get_unread_count()
                    await self.send(text_data=json.dumps({
                        'type': 'unread_count',
                        'count': count
                    }))
            
            elif message_type == 'get_notifications':
                # Obtener notificaciones con paginación
                if self.user.is_authenticated:
                    page = data.get('page', 1)
                    limit = data.get('limit', 20)
                    await self.send_paginated_notifications(page, limit)
            
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Mensaje inválido'
            }))
        except Exception as e:
            logger.error(f"Error procesando mensaje: {str(e)}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Error procesando mensaje'
            }))

    # Métodos para recibir mensajes del channel layer
    async def notification_message(self, event):
        """Manejar mensaje de notificación enviado desde el channel layer"""
        # Enviar mensaje al WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'notification': event['notification']
        }))

    async def broadcast_message(self, event):
        """Manejar mensaje broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'broadcast',
            'message': event['message']
        }))

    # Métodos auxiliares con acceso a base de datos
    @database_sync_to_async
    def is_admin(self):
        """Verificar si el usuario es admin"""
        return self.user.is_staff or self.user.is_superuser

    @database_sync_to_async
    def get_unread_count(self):
        """Obtener cantidad de notificaciones no leídas"""
        from .models import Notification
        return Notification.objects.filter(
            user=self.user,
            read=False
        ).count()

    @database_sync_to_async
    def mark_notification_as_read(self, notification_id):
        """Marcar una notificación como leída"""
        from .models import Notification
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=self.user
            )
            notification.mark_as_read()
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_all_notifications_as_read(self):
        """Marcar todas las notificaciones como leídas"""
        from .models import Notification
        from django.utils import timezone
        
        updated = Notification.objects.filter(
            user=self.user,
            read=False
        ).update(
            read=True,
            read_at=timezone.now()
        )
        return updated

    @database_sync_to_async
    def get_unread_notifications(self):
        """Obtener notificaciones no leídas"""
        from .models import Notification
        from .serializers import NotificationSerializer
        
        notifications = Notification.objects.filter(
            user=self.user,
            read=False
        ).order_by('-created_at')[:20]
        
        # Serializar las notificaciones
        serialized = []
        for notification in notifications:
            serialized.append({
                'id': notification.id,
                'type': notification.type,
                'title': notification.title,
                'message': notification.message,
                'icon': notification.type_icon,
                'priority': notification.priority,
                'priority_color': notification.priority_color,
                'action_url': notification.action_url,
                'created_at': notification.created_at.isoformat(),
                'read': notification.read
            })
        
        return serialized

    async def send_unread_notifications(self):
        """Enviar notificaciones no leídas al conectarse"""
        notifications = await self.get_unread_notifications()
        count = await self.get_unread_count()
        
        await self.send(text_data=json.dumps({
            'type': 'initial_notifications',
            'notifications': notifications,
            'unread_count': count
        }))

    @database_sync_to_async
    def get_paginated_notifications(self, page, limit):
        """Obtener notificaciones paginadas"""
        from .models import Notification
        
        offset = (page - 1) * limit
        notifications = Notification.objects.filter(
            user=self.user
        ).order_by('-created_at')[offset:offset + limit]
        
        # Serializar
        serialized = []
        for notification in notifications:
            serialized.append({
                'id': notification.id,
                'type': notification.type,
                'title': notification.title,
                'message': notification.message,
                'icon': notification.type_icon,
                'priority': notification.priority,
                'priority_color': notification.priority_color,
                'action_url': notification.action_url,
                'created_at': notification.created_at.isoformat(),
                'read': notification.read,
                'read_at': notification.read_at.isoformat() if notification.read_at else None
            })
        
        total = Notification.objects.filter(user=self.user).count()
        
        return {
            'notifications': serialized,
            'page': page,
            'limit': limit,
            'total': total,
            'has_more': offset + limit < total
        }

    async def send_paginated_notifications(self, page, limit):
        """Enviar notificaciones paginadas"""
        data = await self.get_paginated_notifications(page, limit)
        
        await self.send(text_data=json.dumps({
            'type': 'notifications_page',
            **data
        }))
