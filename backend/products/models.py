from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator
from django.conf import settings


class Category(models.Model):
    """Categorías de productos"""

    name = models.CharField('Nombre', max_length=200)
    slug = models.SlugField('Slug', unique=True, blank=True)
    description = models.TextField('Descripción', blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    image = models.ImageField('Imagen', upload_to='categories/', blank=True)

    is_active = models.BooleanField('Activa', default=True)
    order = models.IntegerField('Orden', default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        ordering = ['order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Brand(models.Model):
    """Marcas de productos"""

    name = models.CharField('Nombre', max_length=200)
    slug = models.SlugField('Slug', unique=True, blank=True)
    logo = models.ImageField('Logo', upload_to='brands/', blank=True)
    description = models.TextField('Descripción', blank=True)

    is_active = models.BooleanField('Activa', default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Marca'
        verbose_name_plural = 'Marcas'
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    """Producto principal"""

    # Info básica
    name = models.CharField('Nombre', max_length=300)
    slug = models.SlugField('Slug', unique=True, blank=True, max_length=300)
    sku = models.CharField('SKU', max_length=100, unique=True)
    description = models.TextField('Descripción')
    short_description = models.CharField('Descripción corta', max_length=500, blank=True)

    # Clasificación
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products',
                                 verbose_name='Categoría')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products',
                              verbose_name='Marca')

    # Precios
    price = models.DecimalField('Precio', max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    compare_price = models.DecimalField('Precio de comparación', max_digits=10, decimal_places=2, null=True, blank=True)
    cost = models.DecimalField('Costo', max_digits=10, decimal_places=2, null=True, blank=True,
                               validators=[MinValueValidator(0)])

    # Inventario
    stock = models.IntegerField('Stock', default=0, validators=[MinValueValidator(0)])
    low_stock_threshold = models.IntegerField('Umbral de stock bajo', default=10)
    track_inventory = models.BooleanField('Rastrear inventario', default=True)

    # Físico
    weight = models.DecimalField('Peso (kg)', max_digits=6, decimal_places=2, null=True, blank=True)
    length = models.DecimalField('Largo (cm)', max_digits=6, decimal_places=2, null=True, blank=True)
    width = models.DecimalField('Ancho (cm)', max_digits=6, decimal_places=2, null=True, blank=True)
    height = models.DecimalField('Alto (cm)', max_digits=6, decimal_places=2, null=True, blank=True)

    # SEO
    meta_title = models.CharField('Meta título', max_length=200, blank=True)
    meta_description = models.CharField('Meta descripción', max_length=300, blank=True)

    # Estado
    is_active = models.BooleanField('Activo', default=True)
    is_featured = models.BooleanField('Destacado', default=False)

    # Analytics
    views = models.IntegerField('Vistas', default=0)
    sales_count = models.IntegerField('Ventas totales', default=0)

    # Timestamps
    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['sku']),
            models.Index(fields=['-created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def is_on_sale(self):
        """Verifica si el producto está en oferta"""
        return self.compare_price and self.compare_price > self.price

    @property
    def discount_percentage(self):
        """Calcula el porcentaje de descuento"""
        if self.is_on_sale:
            return round(((self.compare_price - self.price) / self.compare_price) * 100)
        return 0

    @property
    def is_low_stock(self):
        """Verifica si el stock está bajo"""
        return self.stock <= self.low_stock_threshold

    @property
    def is_out_of_stock(self):
        """Verifica si no hay stock"""
        return self.stock == 0


class ProductImage(models.Model):
    """Imágenes de productos"""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField('Imagen', upload_to='products/')
    alt_text = models.CharField('Texto alternativo', max_length=200, blank=True)
    order = models.IntegerField('Orden', default=0)
    is_primary = models.BooleanField('Imagen principal', default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Imagen de Producto'
        verbose_name_plural = 'Imágenes de Productos'
        ordering = ['order']

    def __str__(self):
        return f"Imagen de {self.product.name}"


class ProductVariant(models.Model):
    """Variantes de productos (tallas, colores, etc.)"""

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')

    name = models.CharField('Nombre', max_length=200)  # Ej: "Talla M - Color Rojo"
    sku = models.CharField('SKU', max_length=100, unique=True)

    # Atributos (JSON para flexibilidad)
    attributes = models.JSONField('Atributos', default=dict)  # {"size": "M", "color": "Rojo"}

    price = models.DecimalField('Precio', max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.IntegerField('Stock', default=0)

    is_active = models.BooleanField('Activa', default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Variante de Producto'
        verbose_name_plural = 'Variantes de Productos'

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class Review(models.Model):
    """Reseñas de productos"""

    RATING_CHOICES = [(i, i) for i in range(1, 6)]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')

    rating = models.IntegerField('Calificación', choices=RATING_CHOICES)
    title = models.CharField('Título', max_length=200, blank=True)
    comment = models.TextField('Comentario')

    is_verified_purchase = models.BooleanField('Compra verificada', default=False)
    is_approved = models.BooleanField('Aprobada', default=True)

    created_at = models.DateTimeField('Fecha', auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Reseña'
        verbose_name_plural = 'Reseñas'
        ordering = ['-created_at']
        unique_together = ['product', 'user']  # Un usuario solo puede hacer una reseña por producto

    def __str__(self):
        return f"{self.user.email} - {self.product.name} ({self.rating}★)"