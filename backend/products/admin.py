from django.contrib import admin
from .models import Category, Brand, Product, ProductImage, ProductVariant, Review


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'order', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['order', 'is_active']


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'order', 'is_primary']


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 0
    fields = ['name', 'sku', 'attributes', 'price', 'stock', 'is_active']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'sku', 'category', 'brand', 'price', 'stock', 'is_active', 'is_featured', 'created_at']
    list_filter = ['is_active', 'is_featured', 'category', 'brand', 'created_at']
    search_fields = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'stock', 'is_active', 'is_featured']
    readonly_fields = ['views', 'sales_count', 'created_at', 'updated_at']

    inlines = [ProductImageInline, ProductVariantInline]

    fieldsets = (
        ('Información Básica', {
            'fields': ('name', 'slug', 'sku', 'description', 'short_description')
        }),
        ('Clasificación', {
            'fields': ('category', 'brand')
        }),
        ('Precios', {
            'fields': ('price', 'compare_price', 'cost')
        }),
        ('Inventario', {
            'fields': ('stock', 'low_stock_threshold', 'track_inventory')
        }),
        ('Dimensiones', {
            'fields': ('weight', 'length', 'width', 'height')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description')
        }),
        ('Estado', {
            'fields': ('is_active', 'is_featured')
        }),
        ('Analytics', {
            'fields': ('views', 'sales_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt_text', 'order', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['product__name', 'alt_text']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'sku', 'price', 'stock', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'sku', 'product__name']
    list_editable = ['stock', 'is_active']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'is_verified_purchase', 'is_approved', 'created_at']
    list_filter = ['rating', 'is_verified_purchase', 'is_approved', 'created_at']
    search_fields = ['product__name', 'user__email', 'comment']
    list_editable = ['is_approved']
    readonly_fields = ['created_at', 'updated_at']