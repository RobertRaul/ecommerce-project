from mcp_server import ModelQueryToolset
from .models import Order, OrderItem, OrderStatusHistory, Cart, CartItem, ShippingZone


class OrderTool(ModelQueryToolset):
    model = Order

    def get_queryset(self):
        # Ordenar por fecha descendente
        return super().get_queryset().order_by('-created_at')


class OrderItemTool(ModelQueryToolset):
    model = OrderItem


class OrderStatusHistoryTool(ModelQueryToolset):
    model = OrderStatusHistory

    def get_queryset(self):
        return super().get_queryset().order_by('-created_at')


class CartTool(ModelQueryToolset):
    model = Cart


class CartItemTool(ModelQueryToolset):
    model = CartItem


class ShippingZoneTool(ModelQueryToolset):
    model = ShippingZone

    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)