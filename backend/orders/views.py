from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone  # Añadir este import
from .models import Cart, CartItem, Order, OrderItem, ShippingZone, PaymentMethod
from coupons.models import Coupon, CouponUsage
from products.models import Product, ProductVariant
from .serializers import (
    CartSerializer, AddToCartSerializer,
    OrderSerializer, CreateOrderSerializer, ShippingZoneSerializer,
    PaymentMethodSerializer, PaymentMethodListSerializer
)


class CartViewSet(viewsets.ViewSet):
    """
    API endpoint para el carrito de compras
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

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            variant=variant,
            defaults={'quantity': quantity}
        )

        if not created:
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


class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint para órdenes
    GET /api/orders/ - Lista de órdenes (del usuario o todas si es admin)
    GET /api/orders/{order_number}/ - Detalle de una orden
    POST /api/orders/create/ - Crear nueva orden
    PATCH /api/orders/{order_number}/ - Actualizar orden (solo admin)
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'order_number'

    def get_queryset(self):
        """Los admins ven todas, los usuarios solo las suyas"""
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        return Order.objects.filter(user=user).order_by('-created_at')

    def get_permissions(self):
        """Solo admins pueden actualizar/eliminar"""
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

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

        # Verificar stock
        for item in cart.items.all():
            stock = item.variant.stock if item.variant else item.product.stock
            if stock < item.quantity:
                return Response(
                    {'error': f'Stock insuficiente para {item.product.name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        subtotal = cart.subtotal

        # Calcular envío
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

        # Procesar cupón
        coupon_code = serializer.validated_data.get('coupon_code', '').strip()
        discount_amount = serializer.validated_data.get('discount_amount', 0)
        coupon = None

        if coupon_code:
            try:
                coupon = Coupon.objects.get(
                    code=coupon_code,
                    is_active=True
                )

                # Validar que el cupón siga siendo válido
                now = timezone.now()
                if coupon.valid_from and now < coupon.valid_from:
                    return Response(
                        {'error': 'Este cupón aún no es válido'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if coupon.valid_from and now > coupon.valid_until:
                    return Response(
                        {'error': 'Este cupón ha expirado'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if coupon.usage_limit and coupon.times_used >= coupon.usage_limit:
                    return Response(
                        {'error': 'Este cupón ha alcanzado su límite de uso'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                if coupon.minimum_purchase and subtotal < coupon.minimum_purchase:
                    return Response(
                        {'error': f'El monto mínimo para usar este cupón es S/ {coupon.minimum_purchase}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                from decimal import Decimal
                # Recalcular el descuento para asegurar consistencia
                if coupon.discount_type == 'percentage':
                    calculated_discount = Decimal(str(subtotal)) * Decimal(str(coupon.discount_value)) / Decimal('100')
                    if coupon.max_discount_amount:
                        calculated_discount = min(calculated_discount, Decimal(str(coupon.max_discount_amount)))
                else:  # fixed
                    calculated_discount = Decimal(str(coupon.discount_value))

                # Usar el menor entre el descuento calculado y el enviado
                discount_amount = min(Decimal(str(discount_amount)), calculated_discount)

            except Coupon.DoesNotExist:
                return Response(
                    {'error': 'Cupón inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Calcular total
        from decimal import Decimal

        # Convert all values to Decimal if they aren't already
        subtotal = Decimal(str(subtotal))
        shipping_cost = Decimal(str(shipping_cost))
        discount_amount = Decimal(str(discount_amount))

        total = subtotal + shipping_cost - discount_amount

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
            discount=discount_amount,
            coupon_code=coupon_code if coupon else '',
            coupon_discount=discount_amount if coupon else 0,
            total=total,
            payment_method=serializer.validated_data['payment_method'],
            customer_notes=serializer.validated_data.get('customer_notes', ''),
            status='payment_pending',
        )

        # Crear items
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

            # Incrementar ventas
            cart_item.product.sales_count += cart_item.quantity
            cart_item.product.save()

        # Registrar uso del cupón
        if coupon:
            CouponUsage.objects.create(
                coupon=coupon,
                user=user,
                order=order,
                # Convierte el monto de descuento a Decimal
                discount_amount=Decimal(str(discount_amount))
            )

            # Incrementar contador de usos
            coupon.times_used += 1
            coupon.save()

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


class ShippingZoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de zonas de envío
    GET /api/shipping-zones/ - Listar zonas
    POST /api/shipping-zones/ - Crear zona (solo admin)
    GET /api/shipping-zones/{id}/ - Detalle de zona
    PATCH /api/shipping-zones/{id}/ - Actualizar zona (solo admin)
    DELETE /api/shipping-zones/{id}/ - Eliminar zona (solo admin)
    """
    queryset = ShippingZone.objects.all()
    serializer_class = ShippingZoneSerializer

    def get_permissions(self):
        """Permitir GET público, resto solo admin"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


@api_view(['GET'])
@permission_classes([AllowAny])
def shipping_zones_list(request):
    """Listar zonas de envío disponibles (deprecated, usar ViewSet)"""
    zones = ShippingZone.objects.filter(is_active=True)
    serializer = ShippingZoneSerializer(zones, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def calculate_shipping(request):
    """Calcular costo de envío"""
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


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión completa de métodos de pago
    GET /api/payment-methods/ - Listar métodos habilitados (público)
    POST /api/payment-methods/ - Crear método (solo admin)
    GET /api/payment-methods/{id}/ - Detalle de método
    PATCH /api/payment-methods/{id}/ - Actualizar método (solo admin)
    DELETE /api/payment-methods/{id}/ - Eliminar método (solo admin)
    """
    queryset = PaymentMethod.objects.all()

    def get_serializer_class(self):
        """Usar serializer simplificado para listado público"""
        if self.action == 'list' and not self.request.user.is_staff:
            return PaymentMethodListSerializer
        return PaymentMethodSerializer

    def get_queryset(self):
        """Usuarios regulares solo ven métodos habilitados, admins ven todos"""
        if self.request.user.is_staff:
            return PaymentMethod.objects.all()
        return PaymentMethod.objects.filter(is_enabled=True)

    def get_permissions(self):
        """Permitir GET público, resto solo admin"""
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_methods_list(request):
    """Listar métodos de pago disponibles (deprecated, usar ViewSet)"""
    payment_methods = PaymentMethod.objects.filter(is_enabled=True)
    serializer = PaymentMethodListSerializer(payment_methods, many=True)
    return Response(serializer.data)
