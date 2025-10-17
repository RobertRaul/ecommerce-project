from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from orders.models import Order
from products.models import Product
from .utils import (
    notify_new_order, 
    notify_order_status_change, 
    notify_low_stock,
    notify_new_user,
    notify_payment_status
)
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


@receiver(post_save, sender=Order)
def order_created_handler(sender, instance, created, **kwargs):
    """Manejar creación y actualización de órdenes"""
    if created:
        # Nueva orden creada
        try:
            notify_new_order(instance)
            logger.info(f"Notificación enviada para nueva orden #{instance.id}")
        except Exception as e:
            logger.error(f"Error enviando notificación de nueva orden: {str(e)}")
    else:
        # Orden actualizada - verificar cambio de estado
        if hasattr(instance, '_old_status'):
            old_status = instance._old_status
            if old_status != instance.status:
                try:
                    notify_order_status_change(instance, old_status)
                    logger.info(f"Notificación enviada para cambio de estado de orden #{instance.id}")
                except Exception as e:
                    logger.error(f"Error enviando notificación de cambio de estado: {str(e)}")
        
        # Verificar cambio de estado de pago
        if hasattr(instance, '_old_payment_status'):
            old_payment_status = instance._old_payment_status
            if old_payment_status != instance.payment_status and instance.payment_status in ['paid', 'failed']:
                try:
                    status = 'confirmed' if instance.payment_status == 'paid' else 'failed'
                    notify_payment_status(instance, status)
                    logger.info(f"Notificación enviada para cambio de pago de orden #{instance.id}")
                except Exception as e:
                    logger.error(f"Error enviando notificación de pago: {str(e)}")


@receiver(pre_save, sender=Order)
def order_pre_save_handler(sender, instance, **kwargs):
    """Guardar estado anterior antes de actualizar"""
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_payment_status = old_instance.payment_status
        except Order.DoesNotExist:
            pass


@receiver(post_save, sender=Product)
def product_stock_handler(sender, instance, created, **kwargs):
    """Manejar cambios en el stock de productos"""
    if not created:
        # Solo para productos actualizados
        if instance.stock <= 5:  # Umbral de stock bajo
            try:
                notify_low_stock(instance)
                logger.info(f"Notificación de stock bajo enviada para {instance.name}")
            except Exception as e:
                logger.error(f"Error enviando notificación de stock bajo: {str(e)}")


@receiver(post_save, sender=User)
def user_created_handler(sender, instance, created, **kwargs):
    """Manejar creación de nuevos usuarios"""
    if created and not instance.is_staff:
        # Solo para usuarios normales (no admin)
        try:
            notify_new_user(instance)
            logger.info(f"Notificación enviada para nuevo usuario {instance.username}")
        except Exception as e:
            logger.error(f"Error enviando notificación de nuevo usuario: {str(e)}")


# Signal para manejar cupones usados (si tienes el modelo de cupones)
try:
    from coupons.models import CouponUsage
    
    @receiver(post_save, sender=CouponUsage)
    def coupon_used_handler(sender, instance, created, **kwargs):
        """Manejar uso de cupones"""
        if created:
            from .utils import send_notification
            from .models import NotificationType, NotificationPriority
            
            # Notificar al admin
            User = get_user_model()
            admins = User.objects.filter(is_staff=True)
            
            for admin in admins:
                send_notification(
                    user=admin,
                    notification_type=NotificationType.COUPON_USED,
                    title=f"Cupón Usado: {instance.coupon.code}",
                    message=f"El usuario {instance.user.username} ha usado el cupón {instance.coupon.code} con descuento de S/ {instance.discount_amount}",
                    priority=NotificationPriority.LOW,
                    metadata={
                        'coupon_code': instance.coupon.code,
                        'user': instance.user.username,
                        'discount_amount': str(instance.discount_amount),
                        'discount_type': instance.coupon.discount_type,
                        'discount_value': str(instance.coupon.discount_value)
                    }
                )
except ImportError:
    pass  # El modelo de cupones no existe aún
