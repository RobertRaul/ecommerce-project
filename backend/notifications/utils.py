from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification, NotificationType, NotificationPriority
import logging

logger = logging.getLogger(__name__)
channel_layer = get_channel_layer()


def send_notification(
    user=None,
    notification_type=NotificationType.SYSTEM,
    title="",
    message="",
    priority=NotificationPriority.MEDIUM,
    action_url=None,
    metadata=None,
    is_broadcast=False,
    **kwargs
):
    """
    Crear y enviar notificación en tiempo real
    
    Args:
        user: Usuario receptor (None para broadcast)
        notification_type: Tipo de notificación
        title: Título de la notificación
        message: Mensaje de la notificación
        priority: Prioridad de la notificación
        action_url: URL para acción al hacer click
        metadata: Datos adicionales
        is_broadcast: Si es notificación global
        **kwargs: Campos adicionales (order_id, product_id, etc.)
    
    Returns:
        Notification: Objeto de notificación creado
    """
    try:
        # Crear notificación en la base de datos
        notification = Notification.objects.create(
            user=user if not is_broadcast else None,
            type=notification_type,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
            metadata=metadata or {},
            is_broadcast=is_broadcast,
            **kwargs
        )
        
        # Preparar datos para WebSocket
        notification_data = {
            'id': notification.id,
            'type': notification.type,
            'title': notification.title,
            'message': notification.message,
            'icon': notification.type_icon,
            'priority': notification.priority,
            'priority_color': notification.priority_color,
            'action_url': notification.action_url,
            'created_at': notification.created_at.isoformat(),
            'metadata': notification.metadata
        }
        
        # Enviar por WebSocket
        if is_broadcast:
            # Enviar a todos los usuarios conectados
            async_to_sync(channel_layer.group_send)(
                'notifications_public',
                {
                    'type': 'broadcast_message',
                    'message': notification_data
                }
            )
            # También enviar a admins
            async_to_sync(channel_layer.group_send)(
                'notifications_admins',
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
        elif user:
            # Enviar a usuario específico
            async_to_sync(channel_layer.group_send)(
                f'notifications_user_{user.id}',
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
            
            # Si es una notificación importante, también enviar a admins
            if priority in [NotificationPriority.HIGH, NotificationPriority.URGENT]:
                async_to_sync(channel_layer.group_send)(
                    'notifications_admins',
                    {
                        'type': 'notification_message',
                        'notification': notification_data
                    }
                )
        else:
            # Enviar solo a admins si no hay usuario específico
            async_to_sync(channel_layer.group_send)(
                'notifications_admins',
                {
                    'type': 'notification_message',
                    'notification': notification_data
                }
            )
        
        logger.info(f"Notificación enviada: {notification.title}")
        return notification
        
    except Exception as e:
        logger.error(f"Error enviando notificación: {str(e)}")
        return None


def notify_new_order(order):
    """Notificar nueva orden"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Notificar a todos los admins
    admins = User.objects.filter(is_staff=True)
    for admin in admins:
        send_notification(
            user=admin,
            notification_type=NotificationType.NEW_ORDER,
            title=f"Nueva Orden #{order.id}",
            message=f"Se ha recibido una nueva orden de {order.user.get_full_name() or order.user.username} por ${order.total_amount}",
            priority=NotificationPriority.HIGH,
            action_url=f"/admin/ordenes/{order.id}",
            order_id=order.id,
            metadata={
                'customer_name': order.user.get_full_name() or order.user.username,
                'total_amount': str(order.total_amount),
                'items_count': order.items.count()
            }
        )
    
    # Notificar al cliente
    send_notification(
        user=order.user,
        notification_type=NotificationType.NEW_ORDER,
        title="Orden Confirmada",
        message=f"Tu orden #{order.id} ha sido recibida y está siendo procesada",
        priority=NotificationPriority.MEDIUM,
        action_url=f"/mis-ordenes/{order.id}",
        order_id=order.id
    )


def notify_order_status_change(order, old_status):
    """Notificar cambio de estado de orden"""
    status_messages = {
        'processing': 'Tu orden está siendo procesada',
        'shipped': 'Tu orden ha sido enviada',
        'delivered': 'Tu orden ha sido entregada',
        'cancelled': 'Tu orden ha sido cancelada'
    }
    
    message = status_messages.get(
        order.status, 
        f'El estado de tu orden ha cambiado a {order.get_status_display()}'
    )
    
    send_notification(
        user=order.user,
        notification_type=NotificationType.ORDER_STATUS,
        title=f"Actualización de Orden #{order.id}",
        message=message,
        priority=NotificationPriority.MEDIUM,
        action_url=f"/mis-ordenes/{order.id}",
        order_id=order.id,
        metadata={
            'old_status': old_status,
            'new_status': order.status
        }
    )


def notify_payment_status(order, status):
    """Notificar estado de pago"""
    if status == 'confirmed':
        send_notification(
            user=order.user,
            notification_type=NotificationType.PAYMENT_CONFIRMED,
            title="Pago Confirmado",
            message=f"El pago de tu orden #{order.id} ha sido confirmado",
            priority=NotificationPriority.MEDIUM,
            action_url=f"/mis-ordenes/{order.id}",
            order_id=order.id
        )
        
        # Notificar a admins
        from django.contrib.auth import get_user_model
        User = get_user_model()
        admins = User.objects.filter(is_staff=True)
        for admin in admins:
            send_notification(
                user=admin,
                notification_type=NotificationType.PAYMENT_CONFIRMED,
                title=f"Pago Confirmado - Orden #{order.id}",
                message=f"Se ha confirmado el pago de ${order.total_amount} para la orden #{order.id}",
                priority=NotificationPriority.HIGH,
                action_url=f"/admin/ordenes/{order.id}",
                order_id=order.id
            )
    else:
        send_notification(
            user=order.user,
            notification_type=NotificationType.PAYMENT_FAILED,
            title="Error en el Pago",
            message=f"Hubo un problema procesando el pago de tu orden #{order.id}",
            priority=NotificationPriority.HIGH,
            action_url=f"/mis-ordenes/{order.id}",
            order_id=order.id
        )


def notify_low_stock(product):
    """Notificar stock bajo"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Notificar solo a admins
    admins = User.objects.filter(is_staff=True)
    
    notification_type = NotificationType.OUT_OF_STOCK if product.stock == 0 else NotificationType.LOW_STOCK
    title = f"Sin Stock: {product.name}" if product.stock == 0 else f"Stock Bajo: {product.name}"
    message = f"El producto {product.name} está sin stock" if product.stock == 0 else f"El producto {product.name} tiene solo {product.stock} unidades disponibles"
    
    for admin in admins:
        send_notification(
            user=admin,
            notification_type=notification_type,
            title=title,
            message=message,
            priority=NotificationPriority.HIGH if product.stock == 0 else NotificationPriority.MEDIUM,
            action_url=f"/admin/productos/editar/{product.id}",
            product_id=product.id,
            metadata={
                'product_name': product.name,
                'current_stock': product.stock,
                'sku': product.sku
            }
        )


def notify_new_user(user):
    """Notificar registro de nuevo usuario"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Notificar a admins
    admins = User.objects.filter(is_staff=True)
    for admin in admins:
        send_notification(
            user=admin,
            notification_type=NotificationType.NEW_USER,
            title="Nuevo Usuario Registrado",
            message=f"Se ha registrado un nuevo usuario: {user.get_full_name() or user.username}",
            priority=NotificationPriority.LOW,
            action_url=f"/admin/clientes/{user.id}",
            user_id=user.id,
            metadata={
                'username': user.username,
                'email': user.email,
                'full_name': user.get_full_name()
            }
        )
    
    # Notificar al nuevo usuario
    send_notification(
        user=user,
        notification_type=NotificationType.SYSTEM,
        title="¡Bienvenido!",
        message="Gracias por registrarte. Explora nuestros productos y ofertas especiales.",
        priority=NotificationPriority.LOW,
        action_url="/productos"
    )


def broadcast_promotion(title, message, action_url=None):
    """Enviar promoción a todos los usuarios"""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Crear notificación broadcast
    send_notification(
        notification_type=NotificationType.PROMOTION,
        title=title,
        message=message,
        priority=NotificationPriority.MEDIUM,
        action_url=action_url,
        is_broadcast=True
    )
    
    # También crear notificaciones individuales para usuarios registrados
    users = User.objects.filter(is_active=True)
    for user in users:
        send_notification(
            user=user,
            notification_type=NotificationType.PROMOTION,
            title=title,
            message=message,
            priority=NotificationPriority.LOW,
            action_url=action_url
        )
