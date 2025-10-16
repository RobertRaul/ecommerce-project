from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from notifications.utils import send_notification
from notifications.models import NotificationType, NotificationPriority

User = get_user_model()


class Command(BaseCommand):
    help = 'Envía notificaciones de prueba al sistema'

    def add_arguments(self, parser):
        parser.add_argument(
            '--user',
            type=str,
            help='Username o email del usuario receptor',
        )
        parser.add_argument(
            '--all-admins',
            action='store_true',
            help='Enviar a todos los administradores',
        )
        parser.add_argument(
            '--type',
            type=str,
            default='system',
            choices=['order', 'payment', 'stock', 'user', 'system', 'coupon'],
            help='Tipo de notificación',
        )
        parser.add_argument(
            '--priority',
            type=str,
            default='medium',
            choices=['low', 'medium', 'high'],
            help='Prioridad de la notificación',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n🔔 ENVIANDO NOTIFICACIONES DE PRUEBA\n'))

        # Determinar usuarios destinatarios
        users = []
        if options['all_admins']:
            users = User.objects.filter(is_staff=True)
            self.stdout.write(f"📧 Enviando a {users.count()} administradores")
        elif options['user']:
            try:
                user = User.objects.get(username=options['user'])
                users = [user]
                self.stdout.write(f"📧 Enviando a: {user.username}")
            except User.DoesNotExist:
                try:
                    user = User.objects.get(email=options['user'])
                    users = [user]
                    self.stdout.write(f"📧 Enviando a: {user.email}")
                except User.DoesNotExist:
                    self.stdout.write(self.style.ERROR(f'❌ Usuario no encontrado: {options["user"]}'))
                    return
        else:
            # Por defecto, enviar al primer admin
            user = User.objects.filter(is_staff=True).first()
            if user:
                users = [user]
                self.stdout.write(f"📧 Enviando al primer admin: {user.username}")
            else:
                self.stdout.write(self.style.ERROR('❌ No hay usuarios admin en el sistema'))
                return

        # Mapear tipos y prioridades
        type_map = {
            'order': NotificationType.ORDER,
            'payment': NotificationType.PAYMENT,
            'stock': NotificationType.STOCK,
            'user': NotificationType.USER,
            'system': NotificationType.SYSTEM,
            'coupon': NotificationType.COUPON_USED,
        }

        priority_map = {
            'low': NotificationPriority.LOW,
            'medium': NotificationPriority.MEDIUM,
            'high': NotificationPriority.HIGH,
        }

        notification_type = type_map[options['type']]
        priority = priority_map[options['priority']]

        # Mensajes de prueba según tipo
        test_messages = {
            'order': {
                'title': '🛒 Nueva Orden Recibida',
                'message': 'Se ha creado la orden #TEST-001 por $299.99',
                'metadata': {'order_id': 'TEST-001', 'amount': 299.99}
            },
            'payment': {
                'title': '💳 Pago Confirmado',
                'message': 'El pago de la orden #TEST-001 ha sido procesado exitosamente',
                'metadata': {'order_id': 'TEST-001', 'payment_method': 'credit_card'}
            },
            'stock': {
                'title': '📦 Alerta de Stock Bajo',
                'message': 'El producto "iPhone 15 Pro" tiene solo 3 unidades restantes',
                'metadata': {'product_name': 'iPhone 15 Pro', 'stock': 3}
            },
            'user': {
                'title': '👤 Nuevo Usuario Registrado',
                'message': 'Usuario de prueba "testuser@example.com" se ha registrado',
                'metadata': {'email': 'testuser@example.com'}
            },
            'system': {
                'title': '⚙️ Notificación del Sistema',
                'message': 'Esta es una notificación de prueba del sistema de notificaciones en tiempo real',
                'metadata': {'test': True}
            },
            'coupon': {
                'title': '🎫 Cupón Utilizado',
                'message': 'El cupón "SUMMER2025" ha sido aplicado con éxito (20% descuento)',
                'metadata': {'coupon_code': 'SUMMER2025', 'discount': '20%'}
            },
        }

        message_data = test_messages[options['type']]

        # Enviar notificaciones
        sent_count = 0
        for user in users:
            try:
                notification = send_notification(
                    user=user,
                    notification_type=notification_type,
                    title=message_data['title'],
                    message=message_data['message'],
                    priority=priority,
                    metadata=message_data['metadata']
                )
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Notificación enviada a {user.username} (ID: {notification.id})')
                )
                sent_count += 1
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Error enviando a {user.username}: {str(e)}')
                )

        self.stdout.write(self.style.SUCCESS(f'\n✨ {sent_count} notificación(es) enviada(s) exitosamente\n'))
        self.stdout.write('💡 Revisa el frontend para ver las notificaciones en tiempo real')
        self.stdout.write('🌐 URL: http://localhost:3000/admin\n')
