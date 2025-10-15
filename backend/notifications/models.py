from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class NotificationType(models.TextChoices):
    """Tipos de notificaciones"""
    NEW_ORDER = 'new_order', 'Nueva Orden'
    ORDER_STATUS = 'order_status', 'Cambio de Estado de Orden'
    PAYMENT_CONFIRMED = 'payment_confirmed', 'Pago Confirmado'
    PAYMENT_FAILED = 'payment_failed', 'Pago Fallido'
    LOW_STOCK = 'low_stock', 'Stock Bajo'
    OUT_OF_STOCK = 'out_of_stock', 'Sin Stock'
    NEW_USER = 'new_user', 'Nuevo Usuario'
    NEW_REVIEW = 'new_review', 'Nueva Reseña'
    NEW_MESSAGE = 'new_message', 'Nuevo Mensaje'
    SYSTEM = 'system', 'Sistema'
    PROMOTION = 'promotion', 'Promoción'
    COUPON_USED = 'coupon_used', 'Cupón Usado'


class NotificationPriority(models.TextChoices):
    """Prioridad de notificaciones"""
    LOW = 'low', 'Baja'
    MEDIUM = 'medium', 'Media'
    HIGH = 'high', 'Alta'
    URGENT = 'urgent', 'Urgente'


class Notification(models.Model):
    """Modelo de notificaciones"""
    # Receptor
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
        help_text="Usuario receptor. Si es null, es una notificación global"
    )
    
    # Contenido
    type = models.CharField(
        max_length=20, 
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    icon = models.CharField(
        max_length=50, 
        default='bell',
        help_text="Nombre del icono de Lucide React"
    )
    
    # Prioridad y estado
    priority = models.CharField(
        max_length=10,
        choices=NotificationPriority.choices,
        default=NotificationPriority.MEDIUM
    )
    read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Referencias opcionales
    order_id = models.IntegerField(null=True, blank=True)
    product_id = models.IntegerField(null=True, blank=True)
    user_id = models.IntegerField(null=True, blank=True)
    
    # URL para acción
    action_url = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="URL a donde dirigir al hacer click"
    )
    
    # Metadata adicional
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Datos adicionales en formato JSON"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Fecha de expiración de la notificación"
    )
    
    # Para notificaciones globales/broadcast
    is_broadcast = models.BooleanField(
        default=False,
        help_text="Si es True, se envía a todos los usuarios"
    )

    class Meta:
        ordering = ['-created_at']
        db_table = 'notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        indexes = [
            models.Index(fields=['-created_at', 'user']),
            models.Index(fields=['read', 'user']),
            models.Index(fields=['type']),
        ]

    def __str__(self):
        return f"{self.get_type_display()} - {self.title}"

    def mark_as_read(self):
        """Marcar como leída"""
        if not self.read:
            self.read = True
            self.read_at = timezone.now()
            self.save(update_fields=['read', 'read_at'])
            return True
        return False

    @property
    def is_expired(self):
        """Verificar si la notificación expiró"""
        if self.expires_at:
            return timezone.now() > self.expires_at
        return False

    @property
    def priority_color(self):
        """Obtener color según prioridad"""
        colors = {
            'low': 'gray',
            'medium': 'blue',
            'high': 'yellow',
            'urgent': 'red'
        }
        return colors.get(self.priority, 'blue')

    @property
    def type_icon(self):
        """Obtener icono según tipo"""
        icons = {
            'new_order': 'shopping-cart',
            'order_status': 'package',
            'payment_confirmed': 'credit-card',
            'payment_failed': 'alert-circle',
            'low_stock': 'alert-triangle',
            'out_of_stock': 'x-circle',
            'new_user': 'user-plus',
            'new_review': 'star',
            'new_message': 'message-circle',
            'system': 'info',
            'promotion': 'tag',
            'coupon_used': 'ticket'
        }
        return icons.get(self.type, self.icon)


class NotificationPreference(models.Model):
    """Preferencias de notificación por usuario"""
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='notification_preferences'
    )
    
    # Preferencias por tipo
    email_enabled = models.BooleanField(default=True)
    push_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    
    # Tipos específicos habilitados
    new_orders = models.BooleanField(default=True)
    order_updates = models.BooleanField(default=True)
    payment_updates = models.BooleanField(default=True)
    stock_alerts = models.BooleanField(default=True)
    new_users = models.BooleanField(default=True)
    promotions = models.BooleanField(default=True)
    system_updates = models.BooleanField(default=True)
    
    # Configuración de sonido
    sound_enabled = models.BooleanField(default=True)
    sound_volume = models.IntegerField(default=50)  # 0-100
    
    # Horario de notificaciones
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_preferences'
        verbose_name = 'Preferencia de Notificación'
        verbose_name_plural = 'Preferencias de Notificación'

    def __str__(self):
        return f"Preferencias de {self.user.username}"

    def should_send_notification(self, notification_type):
        """Verificar si debe enviar notificación según tipo"""
        type_map = {
            NotificationType.NEW_ORDER: self.new_orders,
            NotificationType.ORDER_STATUS: self.order_updates,
            NotificationType.PAYMENT_CONFIRMED: self.payment_updates,
            NotificationType.PAYMENT_FAILED: self.payment_updates,
            NotificationType.LOW_STOCK: self.stock_alerts,
            NotificationType.OUT_OF_STOCK: self.stock_alerts,
            NotificationType.NEW_USER: self.new_users,
            NotificationType.PROMOTION: self.promotions,
            NotificationType.SYSTEM: self.system_updates,
        }
        return type_map.get(notification_type, True)
