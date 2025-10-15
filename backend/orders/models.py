from django.db import models
from django.conf import settings
from products.models import Product, ProductVariant
import uuid


class Cart(models.Model):
    """Carrito de compras"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
                             related_name='carts')
    session_key = models.CharField('Session Key', max_length=100, blank=True)  # Para usuarios no autenticados
    
    # Cupón aplicado
    coupon_code = models.CharField('Código de cupón', max_length=50, blank=True, null=True)
    discount_amount = models.DecimalField('Monto de descuento', max_digits=10, decimal_places=2, default=0)

    created_at = models.DateTimeField('Creado', auto_now_add=True)
    updated_at = models.DateTimeField('Actualizado', auto_now=True)

    class Meta:
        verbose_name = 'Carrito'
        verbose_name_plural = 'Carritos'

    def __str__(self):
        return f"Carrito de {self.user.email if self.user else self.session_key}"

    @property
    def total_items(self):
        """Total de items en el carrito"""
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        """Subtotal del carrito"""
        return sum(item.total_price for item in self.items.all())
    
    def get_total(self):
        """Total con descuento aplicado"""
        subtotal = self.subtotal
        return subtotal - self.discount_amount if self.discount_amount else subtotal


class CartItem(models.Model):
    """Item del carrito"""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True, blank=True)

    quantity = models.PositiveIntegerField('Cantidad', default=1)
    price = models.DecimalField('Precio unitario', max_digits=10,
                                decimal_places=2)  # Guardamos el precio al momento de agregar

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Item de Carrito'
        verbose_name_plural = 'Items de Carrito'
        unique_together = ['cart', 'product', 'variant']

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    @property
    def total_price(self):
        """Precio total del item"""
        return self.price * self.quantity

    def save(self, *args, **kwargs):
        # Guardar el precio actual del producto
        if not self.price:
            self.price = self.variant.price if self.variant and self.variant.price else self.product.price
        super().save(*args, **kwargs)


class Order(models.Model):
    """Orden de compra"""

    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('payment_pending', 'Esperando Pago'),
        ('payment_verified', 'Pago Verificado'),
        ('processing', 'Procesando'),
        ('shipped', 'Enviado'),
        ('delivered', 'Entregado'),
        ('cancelled', 'Cancelado'),
        ('refunded', 'Reembolsado'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('yape', 'Yape'),
        ('plin', 'Plin'),
        ('transfer', 'Transferencia Bancaria'),
        ('card', 'Tarjeta'),
        ('cash', 'Efectivo contra entrega'),
    ]

    # ID único
    order_number = models.CharField('Número de orden', max_length=50, unique=True, editable=False)

    # Usuario
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='orders')

    # Datos de contacto
    email = models.EmailField('Email')
    phone = models.CharField('Teléfono', max_length=20)

    # Dirección de envío
    shipping_address = models.TextField('Dirección de envío')
    shipping_city = models.CharField('Ciudad', max_length=100)
    shipping_department = models.CharField('Departamento', max_length=100)
    shipping_postal_code = models.CharField('Código postal', max_length=20, blank=True)

    # Datos de facturación (opcional, puede ser igual a envío)
    billing_address = models.TextField('Dirección de facturación', blank=True)
    billing_city = models.CharField('Ciudad facturación', max_length=100, blank=True)

    # Montos
    subtotal = models.DecimalField('Subtotal', max_digits=10, decimal_places=2)
    shipping_cost = models.DecimalField('Costo de envío', max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField('Impuestos', max_digits=10, decimal_places=2, default=0)
    discount = models.DecimalField('Descuento', max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField('Total', max_digits=10, decimal_places=2)
    
    # Cupón aplicado
    coupon_code = models.CharField('Código de cupón', max_length=50, blank=True, null=True)
    coupon_discount = models.DecimalField('Descuento por cupón', max_digits=10, decimal_places=2, default=0)

    # Pago
    payment_method = models.CharField('Método de pago', max_length=20, choices=PAYMENT_METHOD_CHOICES)
    payment_status = models.CharField('Estado del pago', max_length=20, default='pending')
    payment_proof = models.ImageField('Comprobante de pago', upload_to='payment_proofs/', blank=True)
    transaction_id = models.CharField('ID de transacción', max_length=200, blank=True)

    # Estado
    status = models.CharField('Estado', max_length=20, choices=STATUS_CHOICES, default='pending')

    # Notas
    customer_notes = models.TextField('Notas del cliente', blank=True)
    admin_notes = models.TextField('Notas administrativas', blank=True)

    # Envío
    tracking_number = models.CharField('Número de seguimiento', max_length=200, blank=True)
    shipped_date = models.DateTimeField('Fecha de envío', null=True, blank=True)
    delivered_date = models.DateTimeField('Fecha de entrega', null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        verbose_name = 'Orden'
        verbose_name_plural = 'Órdenes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order_number']),
            models.Index(fields=['user']),
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generar número de orden único
            self.order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Orden {self.order_number}"

    def calculate_total(self):
        """Calcula el total de la orden"""
        self.total = self.subtotal + self.shipping_cost + self.tax - self.discount
        return self.total


class OrderItem(models.Model):
    """Items de una orden"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)

    # Guardamos snapshot de datos por si el producto cambia o se elimina
    product_name = models.CharField('Nombre del producto', max_length=300)
    product_sku = models.CharField('SKU', max_length=100)

    quantity = models.PositiveIntegerField('Cantidad')
    price = models.DecimalField('Precio unitario', max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Item de Orden'
        verbose_name_plural = 'Items de Orden'

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def total_price(self):
        """Precio total del item"""
        return self.price * self.quantity

    def save(self, *args, **kwargs):
        # Guardar snapshot de datos del producto
        if self.product:
            self.product_name = self.product.name
            self.product_sku = self.variant.sku if self.variant else self.product.sku
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    """Historial de cambios de estado de la orden"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField('Estado', max_length=20)
    notes = models.TextField('Notas', blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)

    created_at = models.DateTimeField('Fecha', auto_now_add=True)

    class Meta:
        verbose_name = 'Historial de Estado'
        verbose_name_plural = 'Historial de Estados'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order.order_number} - {self.status}"


class ShippingZone(models.Model):
    """Zonas de envío con costos"""

    name = models.CharField('Nombre', max_length=200)
    departments = models.JSONField('Departamentos', default=list)  # ["Lima", "Cusco"]

    cost = models.DecimalField('Costo de envío', max_digits=10, decimal_places=2)
    free_shipping_threshold = models.DecimalField('Envío gratis desde', max_digits=10, decimal_places=2, null=True,
                                                  blank=True)

    estimated_days = models.CharField('Días estimados', max_length=50)  # "2-3 días"

    is_active = models.BooleanField('Activa', default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Zona de Envío'
        verbose_name_plural = 'Zonas de Envío'

    def __str__(self):
        return self.name