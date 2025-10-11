from django.contrib import admin
from django.utils.safestring import mark_safe
from django.db.models import Sum
from .models import Cart, CartItem, Order, OrderItem, ShippingZone, OrderStatusHistory


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_link', 'item_count', 'cart_total', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__email', 'user__username', 'user__first_name', 'user__last_name']
    readonly_fields = ['session_key', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    @admin.display(description='Usuario')
    def user_link(self, obj):
        if obj.user:
            return mark_safe(f'<a href="/admin/users/user/{obj.user.id}/change/">{obj.user.email}</a>')
        return mark_safe('<span style="color: orange;">Invitado</span>')

    @admin.display(description='Items')
    def item_count(self, obj):
        return obj.items.count()

    @admin.display(description='Total')
    def cart_total(self, obj):
        total = sum(float(item.price) * item.quantity for item in obj.items.all())
        return mark_safe(f'<strong>S/ {total:.2f}</strong>')


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'cart_link', 'product_link', 'variant_link', 'quantity', 'price_display', 'item_total',
                    'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['cart__user__email', 'product_id']
    readonly_fields = ['price', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    @admin.display(description='Carrito')
    def cart_link(self, obj):
        return mark_safe(f'<a href="/admin/orders/cart/{obj.cart.id}/change/">Carrito #{obj.cart.id}</a>')

    @admin.display(description='Producto')
    def product_link(self, obj):
        if obj.product_id:
            return mark_safe(f'<a href="/admin/products/product/{obj.product_id}/change/">Producto #{obj.product_id}</a>')
        return '-'

    @admin.display(description='Variante')
    def variant_link(self, obj):
        if obj.variant_id:
            return mark_safe(f'<a href="/admin/products/productvariant/{obj.variant_id}/change/">Variante #{obj.variant_id}</a>')
        return '-'

    @admin.display(description='Precio Unit.')
    def price_display(self, obj):
        return mark_safe(f'S/ {float(obj.price):.2f}')

    @admin.display(description='Total')
    def item_total(self, obj):
        total = float(obj.price) * obj.quantity
        return mark_safe(f'<strong>S/ {total:.2f}</strong>')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_sku', 'price', 'get_total']
    fields = ['product_name', 'product_sku', 'quantity', 'price', 'get_total']
    can_delete = False

    @admin.display(description='Total')
    def get_total(self, obj):
        if obj.id:
            total = float(obj.price) * obj.quantity
            return mark_safe(f'<strong>S/ {total:.2f}</strong>')
        return '-'


class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['status', 'notes', 'changed_by', 'created_at']
    fields = ['status', 'notes', 'changed_by', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'user_link', 'status_badge', 'total_display',
        'payment_method_display', 'payment_status_badge', 'created_at'
    ]
    list_filter = ['status', 'payment_method', 'payment_status', 'created_at']
    search_fields = [
        'order_number', 'email', 'phone', 'user__email',
        'user__username', 'transaction_id', 'tracking_number'
    ]
    readonly_fields = [
        'order_number', 'user', 'created_at', 'updated_at',
        'subtotal', 'shipping_cost', 'tax', 'discount', 'total'
    ]
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline, OrderStatusHistoryInline]

    fieldsets = (
        ('Información del Pedido', {
            'fields': ('order_number', 'user', 'status', 'payment_status')
        }),
        ('Información de Contacto', {
            'fields': ('email', 'phone')
        }),
        ('Dirección de Envío', {
            'fields': (
                'shipping_address',
                'shipping_city',
                'shipping_department',
                'shipping_postal_code'
            )
        }),
        ('Dirección de Facturación', {
            'fields': ('billing_address', 'billing_city'),
            'classes': ('collapse',)
        }),
        ('Costos', {
            'fields': ('subtotal', 'shipping_cost', 'tax', 'discount', 'total')
        }),
        ('Pago', {
            'fields': ('payment_method', 'payment_proof', 'transaction_id')
        }),
        ('Envío', {
            'fields': ('tracking_number', 'shipped_date', 'delivered_date')
        }),
        ('Notas', {
            'fields': ('customer_notes', 'admin_notes')
        }),
        ('Fechas', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['mark_as_payment_verified', 'mark_as_processing', 'mark_as_shipped', 'mark_as_delivered']

    @admin.display(description='Usuario')
    def user_link(self, obj):
        if obj.user:
            return mark_safe(f'<a href="/admin/users/user/{obj.user.id}/change/">{obj.user.email}</a>')
        return obj.email

    @admin.display(description='Estado')
    def status_badge(self, obj):
        colors = {
            'pending': '#6B7280',
            'payment_pending': '#F59E0B',
            'payment_verified': '#3B82F6',
            'processing': '#8B5CF6',
            'shipped': '#06B6D4',
            'delivered': '#10B981',
            'cancelled': '#EF4444',
        }
        color = colors.get(obj.status, '#6B7280')
        display = obj.get_status_display() if hasattr(obj, 'get_status_display') else obj.status
        return mark_safe(
            f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 3px; font-weight: bold;">{display}</span>'
        )

    @admin.display(description='Estado de Pago')
    def payment_status_badge(self, obj):
        colors = {
            'pending': '#F59E0B',
            'paid': '#10B981',
            'failed': '#EF4444',
            'refunded': '#3B82F6',
        }
        color = colors.get(obj.payment_status, '#6B7280')
        display = obj.get_payment_status_display() if hasattr(obj, 'get_payment_status_display') else obj.payment_status
        return mark_safe(
            f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 3px;">{display}</span>'
        )

    @admin.display(description='Total')
    def total_display(self, obj):
        return mark_safe(f'<strong style="color: #10B981;">S/ {float(obj.total):.2f}</strong>')

    @admin.display(description='Método de Pago')
    def payment_method_display(self, obj):
        if hasattr(obj, 'get_payment_method_display'):
            return obj.get_payment_method_display()
        return obj.payment_method

    @admin.action(description='Marcar pago como verificado')
    def mark_as_payment_verified(self, request, queryset):
        updated = queryset.update(status='payment_verified', payment_status='paid')
        self.message_user(request, f'{updated} órdenes marcadas como pago verificado')

    @admin.action(description='Marcar como en proceso')
    def mark_as_processing(self, request, queryset):
        updated = queryset.update(status='processing')
        self.message_user(request, f'{updated} órdenes marcadas como en proceso')

    @admin.action(description='Marcar como enviado')
    def mark_as_shipped(self, request, queryset):
        updated = queryset.update(status='shipped')
        self.message_user(request, f'{updated} órdenes marcadas como enviadas')

    @admin.action(description='Marcar como entregado')
    def mark_as_delivered(self, request, queryset):
        updated = queryset.update(status='delivered')
        self.message_user(request, f'{updated} órdenes marcadas como entregadas')


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'order_link', 'product_name', 'product_sku',
        'quantity', 'price_display', 'item_total', 'created_at'
    ]
    list_filter = ['created_at']
    search_fields = ['order__order_number', 'product_name', 'product_sku']
    readonly_fields = ['product_name', 'product_sku', 'price', 'created_at']

    @admin.display(description='Orden')
    def order_link(self, obj):
        return mark_safe(f'<a href="/admin/orders/order/{obj.order.id}/change/">{obj.order.order_number}</a>')

    @admin.display(description='Precio Unit.')
    def price_display(self, obj):
        return mark_safe(f'S/ {float(obj.price):.2f}')

    @admin.display(description='Total')
    def item_total(self, obj):
        total = float(obj.price) * obj.quantity
        return mark_safe(f'<strong>S/ {total:.2f}</strong>')


@admin.register(ShippingZone)
class ShippingZoneAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'departments_display', 'cost_display',
        'free_shipping_threshold_display', 'estimated_days', 'is_active'
    ]
    list_filter = ['is_active']
    search_fields = ['name', 'departments']

    fieldsets = (
        ('Información de la Zona', {
            'fields': ('name', 'departments', 'is_active')
        }),
        ('Costos', {
            'fields': ('cost', 'free_shipping_threshold')
        }),
        ('Tiempo de Entrega', {
            'fields': ('estimated_days',)
        }),
        ('Fechas', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at']

    @admin.display(description='Departamentos')
    def departments_display(self, obj):
        if isinstance(obj.departments, list):
            dept_list = ', '.join(obj.departments[:3])
            if len(obj.departments) > 3:
                dept_list += '...'
            return dept_list
        return str(obj.departments)

    @admin.display(description='Costo')
    def cost_display(self, obj):
        return mark_safe(f'<strong>S/ {float(obj.cost):.2f}</strong>')

    @admin.display(description='Envío Gratis desde')
    def free_shipping_threshold_display(self, obj):
        if obj.free_shipping_threshold:
            return mark_safe(f'S/ {float(obj.free_shipping_threshold):.2f} o más')
        return mark_safe('<span style="color: gray;">No aplica</span>')


@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['order_link', 'status_badge', 'changed_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order__order_number', 'notes', 'changed_by__username']
    readonly_fields = ['order', 'status', 'notes', 'changed_by', 'created_at']
    date_hierarchy = 'created_at'

    @admin.display(description='Orden')
    def order_link(self, obj):
        return mark_safe(f'<a href="/admin/orders/order/{obj.order.id}/change/">{obj.order.order_number}</a>')

    @admin.display(description='Estado')
    def status_badge(self, obj):
        colors = {
            'pending': '#6B7280',
            'payment_pending': '#F59E0B',
            'payment_verified': '#3B82F6',
            'processing': '#8B5CF6',
            'shipped': '#06B6D4',
            'delivered': '#10B981',
            'cancelled': '#EF4444',
        }
        color = colors.get(obj.status, '#6B7280')
        display = obj.get_status_display() if hasattr(obj, 'get_status_display') else obj.status
        return mark_safe(
            f'<span style="background-color: {color}; color: white; padding: 3px 10px; border-radius: 3px;">{display}</span>'
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False