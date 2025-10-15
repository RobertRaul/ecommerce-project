from django.contrib import admin
from .models import Coupon, CouponUsage


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'times_used', 'usage_limit', 'valid_from', 'valid_until', 'is_active']
    list_filter = ['discount_type', 'is_active', 'created_at']
    search_fields = ['code', 'description']
    filter_horizontal = ['applicable_products', 'applicable_categories']
    readonly_fields = ['times_used', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('code', 'description', 'is_active')
        }),
        ('Descuento', {
            'fields': ('discount_type', 'discount_value', 'max_discount_amount', 'minimum_purchase')
        }),
        ('Límites de Uso', {
            'fields': ('usage_limit', 'usage_limit_per_user', 'times_used')
        }),
        ('Vigencia', {
            'fields': ('valid_from', 'valid_until')
        }),
        ('Aplicabilidad', {
            'fields': ('applicable_to_all', 'applicable_products', 'applicable_categories')
        }),
        ('Metadatos', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ['coupon', 'user', 'order', 'discount_amount', 'used_at']
    list_filter = ['used_at']
    search_fields = ['coupon__code', 'user__email', 'order__order_number']
    readonly_fields = ['coupon', 'user', 'order', 'discount_amount', 'used_at']
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
