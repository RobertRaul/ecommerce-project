from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from orders.models import Order
from products.models import Product
from users.models import User


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        # Fecha actual
        now = timezone.now()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        # Ventas del mes
        monthly_sales = Order.objects.filter(
            created_at__gte=month_start,
            status__in=['payment_verified', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('total'))['total'] or 0

        # Órdenes pendientes
        pending_orders = Order.objects.filter(
            status__in=['pending', 'payment_pending']
        ).count()

        # Total productos
        total_products = Product.objects.filter(is_active=True).count()

        # Total clientes
        total_customers = User.objects.filter(is_active=True, is_staff=False).count()

        return Response({
            'monthly_sales': float(monthly_sales),
            'pending_orders': pending_orders,
            'total_products': total_products,
            'total_customers': total_customers,
        })