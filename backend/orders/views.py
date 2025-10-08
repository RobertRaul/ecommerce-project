from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Cart, CartItem, Order, OrderItem, ShippingZone
from products.models import Product, ProductVariant
from .serializers import (
    CartSerializer, CartItemSerializer, AddToCartSerializer,
    OrderSerializer, CreateOrderSerializer, ShippingZoneSerializer
)


class CartViewSet(viewsets.ViewSet):
    """
    API endpoint para el carrito de compras
    GET /api/cart/ - Obtener carrito actual
    POST /api/cart/add/ - Agregar producto al carrito
    PUT /api/cart/update/{item_id}/ - Actualizar cantidad
    DELETE /api/cart/remove/{item_id}/ - Eliminar item
    DELETE /api/cart/clear/ - Vaciar carrito
    """
    permission_classes = [IsAuthenticated]

    def get_cart(self, user):
        """Obtener o crear carrito del usuario"""
        cart, created = Cart.objects.get_or_create(user=user)
        return cart

    def list(self, request):
        """Obtener carrito actual"""
        cart = self.get_cart(request.user)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def add(self, request):
        """Agregar producto al carrito"""
        serializer = AddToCartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product_id']
        variant_id = serializer.validated_data.get('variant_id')
        quantity = serializer.validated_data['quantity']

        product = get_object_or_404(Product, id=product_id, is_active=True)
        variant = None
        if variant_id:
            variant = get_object_or_404(ProductVariant, id=variant_id, product=product)

        cart = self.get_cart(request.user)

        # Verificar si el item ya existe en el carrito
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={'quantity': quantity}
        )

        if not created:
            # Actualizar cantidad si ya existe
            cart_item.quantity += quantity
            cart_item.save()

        return Response({
            'message': 'Producto agregado al carrito',
            'cart': CartSerializer(cart, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='update/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        """Actualizar cantidad de un item"""
        cart = self.get_cart(request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)

        quantity = request.data.get('quantity')
        if not quantity or int(quantity) < 1:
            return Response(
                {'error': 'La cantidad debe ser al menos 1'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar stock
        if cart_item.variant:
            if cart_item.variant.stock < int(quantity):
                return Response(
                    {'error': f'Stock insuficiente. Solo hay {cart_item.variant.stock} unidades'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            if cart_item.product.stock < int(quantity):
                return Response(
                    {'error': f'Stock insuficiente. Solo hay {cart_item.product.stock} unidades'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        cart_item.quantity = int(quantity)
        cart_item.save()

        return Response({
            'message': 'Cantidad actualizada',
            'cart': CartSerializer(cart, context={'request': request}).data
        })

    @action(detail=False, methods=['delete'], url_path='remove/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        """Eliminar item del carrito"""
        cart = self.get_cart(request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()

        return Response({
            'message': 'Producto eliminado del carrito',
            'cart': CartSerializer(cart, context={'request': request}).data
        })

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        """Vaciar carrito"""
        cart = self.get_cart(request.user)
        cart.items.all().delete()

        return Response({
            'message': 'Carrito vaciado',
            'cart': CartSerializer(cart, context={'request': request}).data
        })


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint para órdenes
    GET /api/orders/ - Lista de órdenes del usuario
    GET /api/orders/{order_number}/ - Detalle de una orden
    POST /api/orders/create/ - Crear nueva orden
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_order(self, request):
        """Crear nueva orden desde el carrito"""
        serializer = CreateOrderSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user

        # Obtener carrito
        try:
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            return Response(
                {'error': 'No tienes items en el carrito'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not cart.items.exists():
            return Response(
                {'error': 'El carrito está vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verificar stock antes de crear la orden
        for item in cart.items.all():
            stock = item.variant.stock if item.variant else item.product.stock
            if stock < item.quantity:
                return Response(
                    {'error': f'Stock insuficiente para {item.product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calcular costos
        subtotal = cart.subtotal

        # Calcular costo de envío
        shipping_department = serializer.validated_data['shipping_department']
        shipping_zone = ShippingZone.objects.filter(
            departments__contains=[shipping_department],
            is_active=True
        ).first()

        shipping_cost = 0
        if shipping_zone:
            if shipping_zone.free_shipping_threshold and subtotal >= shipping_zone.free_shipping_threshold:
                shipping_cost = 0
            else:
                shipping_cost = shipping_zone.cost

        total = subtotal + shipping_cost

        # Crear orden
        order = Order.objects.create(
            user=user,
            email=serializer.validated_data['email'],
            phone=serializer.validated_data['phone'],
            shipping_address=serializer.validated_data['shipping_address'],
            shipping_city=serializer.validated_data['shipping_city'],
            shipping_department=shipping_department,
            shipping_postal_code=serializer.validated_data.get('shipping_postal_code', ''),
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            total=total,
            payment_method=serializer.validated_data['payment_method'],
            customer_notes=serializer.validated_data.get('customer_notes', ''),
            status='payment_pending',
        )

        # Crear items de la orden
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                variant=cart_item.variant,
                quantity=cart_item.quantity,
                price=cart_item.price,
            )

            # Reducir stock
            if cart_item.variant:
                cart_item.variant.stock -= cart_item.quantity
                cart_item.variant.save()
            else:
                cart_item.product.stock -= cart_item.quantity
                cart_item.product.save()

            # Incrementar contador de ventas
            cart_item.product.sales_count += cart_item.quantity
            cart_item.product.save()

        # Vaciar carrito
        cart.items.all().delete()

        return Response({
            'message': 'Orden creada exitosamente',
            'order': OrderSerializer(order, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def upload_payment_proof(self, request, order_number=None):
        """Subir comprobante de pago"""
        order = self.get_object()

        if order.payment_method not in ['yape', 'plin', 'transfer']:
            return Response(
                {'error': 'Este método de pago no requiere comprobante'},
                status=status.HTTP_400_BAD_REQUEST
            )

        payment_proof = request.FILES.get('payment_proof')
        if not payment_proof:
            return Response(
                {'error': 'Debes subir un comprobante de pago'},
                status=status.HTTP_400_BAD_REQUEST
            )

        order.payment_proof = payment_proof
        order.status = 'payment_pending'
        order.save()

        return Response({
            'message': 'Comprobante subido exitosamente. Tu pago será verificado pronto.',
            'order': OrderSerializer(order, context={'request': request}).data
        })


@api_view(['GET'])
@permission_classes([AllowAny])
def shipping_zones_list(request):
    """
    GET /api/shipping-zones/
    Listar zonas de envío disponibles
    """
    zones = ShippingZone.objects.filter(is_active=True)
    serializer = ShippingZoneSerializer(zones, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_shipping(request):
    """
    POST /api/calculate-shipping/
    Calcular costo de envío para un departamento
    Body: { "department": "Lima", "subtotal": 150.00 }
    """
    department = request.data.get('department')
    subtotal = request.data.get('subtotal', 0)

    if not department:
        return Response(
            {'error': 'Debes proporcionar un departamento'},
            status=status.HTTP_400_BAD_REQUEST
        )

    shipping_zone = ShippingZone.objects.filter(
        departments__contains=[department],
        is_active=True
    ).first()

    if not shipping_zone:
        return Response({
            'cost': 0,
            'message': 'No hay cobertura para este departamento'
        })

    cost = shipping_zone.cost
    free_shipping = False

    if shipping_zone.free_shipping_threshold and float(subtotal) >= float(shipping_zone.free_shipping_threshold):
        cost = 0
        free_shipping = True

    return Response({
        'cost': float(cost),
        'zone': shipping_zone.name,
        'estimated_days': shipping_zone.estimated_days,
        'free_shipping': free_shipping,
        'free_shipping_threshold': float(
            shipping_zone.free_shipping_threshold) if shipping_zone.free_shipping_threshold else None
    })