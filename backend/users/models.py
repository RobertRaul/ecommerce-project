from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Usuario personalizado con campos adicionales"""

    email = models.EmailField('Correo electrónico', unique=True)
    phone = models.CharField('Teléfono', max_length=20, blank=True)

    # Dirección
    address = models.TextField('Dirección', blank=True)
    city = models.CharField('Ciudad', max_length=100, blank=True)
    department = models.CharField('Departamento', max_length=100, blank=True)
    postal_code = models.CharField('Código Postal', max_length=20, blank=True)

    # Verificación
    email_verified = models.BooleanField('Email verificado', default=False)
    email_verification_token = models.CharField(max_length=100, blank=True)

    # Metadata
    created_at = models.DateTimeField('Fecha de registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.username


class UserProfile(models.Model):
    """Perfil extendido del usuario para analytics"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')

    # Analytics
    total_orders = models.IntegerField('Total de pedidos', default=0)
    total_spent = models.DecimalField('Total gastado', max_digits=10, decimal_places=2, default=0)
    last_purchase = models.DateTimeField('Última compra', null=True, blank=True)

    # Preferencias
    favorite_categories = models.JSONField('Categorías favoritas', default=list, blank=True)

    # RFM Score (para data science)
    rfm_score = models.IntegerField('RFM Score', default=0)
    customer_segment = models.CharField('Segmento', max_length=50, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Perfil de Usuario'
        verbose_name_plural = 'Perfiles de Usuarios'

    def __str__(self):
        return f"Perfil de {self.user.email}"