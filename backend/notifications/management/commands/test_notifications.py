from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from notifications.models import Notification, NotificationType, NotificationPriority
from notifications.utils import send_notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

User = get_user_model()


class Command(BaseCommand):
    help = 'Enviar notificaciones de prueba a usuarios'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Username del usuario para enviar notificación',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Enviar notificación a todos los usuarios',
        )
        parser.add_argument(
            '--broadcast',
            action='store_true',
            help='Enviar notificación broadcast',
        )

    def handle(self, *args, **options):
        channel_layer = get_channel_layer()

        if options['broadcast']:
            self.send_broadcast(channel_layer)
        elif options['all']:
            self.send_to_all_users(channel_layer)
        elif options['user']:
            self.send_to_user(options['user'], channel_layer)
        else:
            self.send_to_superusers(channel_layer)

    def send_to_user(self, username, channel_layer):
        """Enviar notificación a un usuario específico"""
        try:
            user = User.objects.get(username=username)

            notification = send_notification(
                user=user,
                notification_type=NotificationType.SYSTEM,
                title="Prueba de Notificación",
                message=f"Hola {user.first_name}, esta es una notificación de prueba",
                priority=NotificationPriority.MEDIUM,
                icon='bell'
            )

            # Enviar a través de WebSocket
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{user.id}',
                {
                    'type': 'notification_message',
                    'notification': {
                        'id': notification.id,
                        'type': notification.type,
                        'title': notification.title,
                        'message': notification.message,
                        'icon': notification.type_icon,
                        'priority': notification.priority,
                        'priority_color': notification.priority_color,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )

            self.stdout.write(
                self.style.SUCCESS(
                    f'[OK] Notificacion enviada a {username}'
                )
            )
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'[ERROR] Usuario {username} no encontrado')
            )

    def send_to_all_users(self, channel_layer):
        """Enviar notificación a todos los usuarios"""
        users = User.objects.filter(is_active=True)

        for user in users:
            notification = send_notification(
                user=user,
                notification_type=NotificationType.SYSTEM,
                title="Notificación General",
                message="Esto es una notificación de prueba enviada a todos los usuarios",
                priority=NotificationPriority.LOW,
            )

            # Enviar a través de WebSocket
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{user.id}',
                {
                    'type': 'notification_message',
                    'notification': {
                        'id': notification.id,
                        'type': notification.type,
                        'title': notification.title,
                        'message': notification.message,
                        'icon': notification.type_icon,
                        'priority': notification.priority,
                        'priority_color': notification.priority_color,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'[OK] Notificacion enviada a {users.count()} usuarios'
            )
        )

    def send_to_superusers(self, channel_layer):
        """Enviar notificación a superusuarios (por defecto)"""
        superusers = User.objects.filter(is_superuser=True)

        for user in superusers:
            notification = send_notification(
                user=user,
                notification_type=NotificationType.SYSTEM,
                title="Prueba de Notificación del Sistema",
                message="Tu sistema de notificaciones está funcionando correctamente",
                priority=NotificationPriority.HIGH,
                icon='check-circle'
            )

            # Enviar a través de WebSocket
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{user.id}',
                {
                    'type': 'notification_message',
                    'notification': {
                        'id': notification.id,
                        'type': notification.type,
                        'title': notification.title,
                        'message': notification.message,
                        'icon': notification.type_icon,
                        'priority': notification.priority,
                        'priority_color': notification.priority_color,
                        'created_at': notification.created_at.isoformat(),
                    }
                }
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'[OK] Notificacion enviada a {superusers.count()} superusuarios'
            )
        )

    def send_broadcast(self, channel_layer):
        """Enviar notificación broadcast a todos"""
        # Crear notificación broadcast
        notification = Notification.objects.create(
            type=NotificationType.SYSTEM,
            title="Anuncio General del Sistema",
            message="Este es un anuncio enviado a todos los usuarios conectados",
            priority=NotificationPriority.HIGH,
            is_broadcast=True,
            icon='megaphone'
        )

        # Enviar a través de WebSocket al grupo público
        async_to_sync(channel_layer.group_send)(
            'notifications_public',
            {
                'type': 'broadcast_message',
                'message': {
                    'id': notification.id,
                    'type': notification.type,
                    'title': notification.title,
                    'message': notification.message,
                    'icon': notification.type_icon,
                    'priority': notification.priority,
                    'priority_color': notification.priority_color,
                    'created_at': notification.created_at.isoformat(),
                }
            }
        )

        self.stdout.write(
            self.style.SUCCESS(
                '[OK] Notificacion broadcast enviada a todos'
            )
        )
