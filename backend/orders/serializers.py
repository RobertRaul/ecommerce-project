from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem, ShippingZone
from products.models import Product, ProductVariant
from products.serializers import ProductListSerializer


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)
    variant_name = serializers.CharField(source='variant.name', read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_detail', 'variant', 'variant_name',
            'quantity', 'price', 'total_price'
        ]
        read_only_fields = ['price', 'total_price']

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("La cantidad debe ser al menos 1")
        return value

    def validate(self, attrs):
        product = attrs.get('product')
        variant = attrs.get('variant')
        quantity = attrs.get('quantity', 1)

        # Verificar stock
        if variant:
            if variant.stock < quantity:
                raise serializers.ValidationError(
                    f"Stock insuficiente. Solo hay {variant.stock} unidades disponibles."
                )
        else:
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Stock insuficiente. Solo hay {product.stock} unidades disponibles."
                )

        return attrs


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'subtotal', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(default=1, min_value=1)

    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Producto no encontrado")
        return value

    def validate(self, attrs):
        product_id = attrs.get('product_id')
        variant_id = attrs.get('variant_id')
        quantity = attrs.get('quantity')

        product = Product.objects.get(id=product_id)

        if variant_id:
            try:
                variant = ProductVariant.objects.get(id=variant_id, product=product)
                if variant.stock < quantity:
                    raise serializers.ValidationError(
                        f"Stock insuficiente. Solo hay {variant.stock} unidades disponibles."
                    )
            except ProductVariant.DoesNotExist:
                raise serializers.ValidationError("Variante no encontrada")
        else:
            if product.stock < quantity:
                raise serializers.ValidationError(
                    f"Stock insuficiente. Solo hay {product.stock} unidades disponibles."
                )

        return attrs


class OrderItemSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product', 'variant', 'product_name', 'product_sku',
            'quantity', 'price', 'total_price'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'email', 'phone',
            'shipping_address', 'shipping_city', 'shipping_department', 'shipping_postal_code',
            'subtotal', 'shipping_cost', 'tax', 'discount', 'total',
            'payment_method', 'payment_method_display', 'payment_status',
            'payment_proof', 'transaction_id',
            'status', 'status_display', 'customer_notes', 'admin_notes', 'tracking_number',
            'items', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'order_number', 'user', 'subtotal', 'total',
            'created_at', 'updated_at'
        ]


class CreateOrderSerializer(serializers.Serializer):
    # Datos de contacto
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)

    # Dirección de envío
    shipping_address = serializers.CharField()
    shipping_city = serializers.CharField(max_length=100)
    shipping_department = serializers.CharField(max_length=100)
    shipping_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)

    # Método de pago
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_METHOD_CHOICES)

    # Agregar campos para el cupón
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    discount_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        default=0
    )

    # Notas
    customer_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        # Verificar que el usuario tenga items en el carrito
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            cart = Cart.objects.filter(user=request.user).first()
            if not cart or not cart.items.exists():
                raise serializers.ValidationError("El carrito está vacío")

        return attrs


class ShippingZoneSerializer(serializers.ModelSerializer):
    departments = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )
    
    class Meta:
        model = ShippingZone
        fields = [
            'id', 'name', 'departments', 'cost',
            'free_shipping_threshold', 'estimated_days', 'is_active'
        ]