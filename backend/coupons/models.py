from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from products.models import Product, Category


class Coupon(models.Model):
    """Cupones de descuento"""
    
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Porcentaje'),
        ('fixed', 'Monto Fijo'),
    ]
    
    code = models.CharField('Código', max_length=50, unique=True, db_index=True)
    description = models.TextField('Descripción', blank=True)
    
    # Tipo de descuento
    discount_type = models.CharField('Tipo', max_length=20, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField('Valor', max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Restricciones
    minimum_purchase = models.DecimalField('Compra mínima', max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    max_discount_amount = models.DecimalField('Descuento máximo', max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    
    # Límites de uso
    usage_limit = models.PositiveIntegerField('Límite de usos', null=True, blank=True, help_text='Dejar vacío para uso ilimitado')
    usage_limit_per_user = models.PositiveIntegerField('Límite por usuario', default=1)
    times_used = models.PositiveIntegerField('Veces usado', default=0)
    
    # Vigencia
    valid_from = models.DateTimeField('Válido desde')
    valid_until = models.DateTimeField('Válido hasta')
    
    # Aplicabilidad
    applicable_to_all = models.BooleanField('Aplicable a todos los productos', default=True)
    applicable_products = models.ManyToManyField(Product, blank=True, related_name='coupons', verbose_name='Productos aplicables')
    applicable_categories = models.ManyToManyField(Category, blank=True, related_name='coupons', verbose_name='Categorías aplicables')
    
    # Estado
    is_active = models.BooleanField('Activo', default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.code
    
    def is_valid(self):
        """Verificar si el cupón es válido"""
        now = timezone.now()
        
        # Verificar estado
        if not self.is_active:
            return False, "Cupón inactivo"
        
        # Verificar fechas
        if now < self.valid_from:
            return False, "Cupón aún no válido"
        if now > self.valid_until:
            return False, "Cupón expirado"
        
        # Verificar límite de usos
        if self.usage_limit and self.times_used >= self.usage_limit:
            return False, "Cupón agotado"
        
        return True, "Válido"
    
    def can_be_used_by_user(self, user):
        """Verificar si un usuario puede usar el cupón"""
        if not user or not user.is_authenticated:
            return True, "OK"
        
        usage_count = CouponUsage.objects.filter(
            coupon=self,
            user=user
        ).count()
        
        if usage_count >= self.usage_limit_per_user:
            return False, f"Ya has usado este cupón {self.usage_limit_per_user} vez/veces"
        
        return True, "OK"
    
    def calculate_discount(self, subtotal):
        """Calcular el monto de descuento"""
        if self.discount_type == 'percentage':
            discount = (subtotal * self.discount_value) / 100
            if self.max_discount_amount:
                discount = min(discount, self.max_discount_amount)
        else:  # fixed
            discount = self.discount_value
        
        # El descuento no puede ser mayor al subtotal
        return min(discount, subtotal)
    
    def is_applicable_to_products(self, cart_items):
        """Verificar si el cupón aplica a los productos del carrito"""
        if self.applicable_to_all:
            return True
        
        # Verificar si hay productos o categorías aplicables
        if not self.applicable_products.exists() and not self.applicable_categories.exists():
            return False
        
        for item in cart_items:
            product = item.product
            # Verificar producto específico
            if self.applicable_products.filter(id=product.id).exists():
                return True
            # Verificar categoría
            if self.applicable_categories.filter(id=product.category_id).exists():
                return True
        
        return False


class CouponUsage(models.Model):
    """Registro de uso de cupones"""
    
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, related_name='usages')
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True)
    
    discount_amount = models.DecimalField('Monto descontado', max_digits=10, decimal_places=2)
    
    used_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Uso de Cupón'
        verbose_name_plural = 'Usos de Cupones'
        ordering = ['-used_at']
    
    def __str__(self):
        return f"{self.coupon.code} - {self.used_at.strftime('%Y-%m-%d')}"
