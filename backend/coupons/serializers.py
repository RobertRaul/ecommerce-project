from rest_framework import serializers
from .models import Coupon, CouponUsage
from products.serializers import ProductListSerializer, CategorySerializer


class CouponSerializer(serializers.ModelSerializer):
    is_valid_status = serializers.SerializerMethodField()
    discount_display = serializers.SerializerMethodField()
    usage_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'minimum_purchase', 'max_discount_amount',
            'usage_limit', 'usage_limit_per_user', 'times_used',
            'valid_from', 'valid_until',
            'applicable_to_all', 'applicable_products', 'applicable_categories',
            'is_active', 'created_at', 'updated_at',
            'is_valid_status', 'discount_display', 'usage_percentage'
        ]
        read_only_fields = ['times_used', 'created_at', 'updated_at']
    
    def get_is_valid_status(self, obj):
        is_valid, message = obj.is_valid()
        return {'valid': is_valid, 'message': message}
    
    def get_discount_display(self, obj):
        if obj.discount_type == 'percentage':
            return f"{obj.discount_value}%"
        return f"S/ {obj.discount_value}"
    
    def get_usage_percentage(self, obj):
        if not obj.usage_limit:
            return None
        return round((obj.times_used / obj.usage_limit) * 100, 2)


class CouponDetailSerializer(CouponSerializer):
    applicable_products_details = ProductListSerializer(source='applicable_products', many=True, read_only=True)
    applicable_categories_details = CategorySerializer(source='applicable_categories', many=True, read_only=True)
    
    class Meta(CouponSerializer.Meta):
        fields = CouponSerializer.Meta.fields + [
            'applicable_products_details',
            'applicable_categories_details'
        ]


class ValidateCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)


class CouponUsageSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = CouponUsage
        fields = [
            'id', 'coupon', 'coupon_code', 'user', 'user_email',
            'order', 'order_number', 'discount_amount', 'used_at'
        ]
        read_only_fields = fields
