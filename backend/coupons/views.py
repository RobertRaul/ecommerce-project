from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated, AllowAny
from django.utils import timezone
from django.db.models import Q, Count, Sum

from .models import Coupon, CouponUsage
from .serializers import (
    CouponSerializer, CouponDetailSerializer,
    ValidateCouponSerializer, ApplyCouponSerializer,
    CouponUsageSerializer
)
from orders.models import Cart


class CouponViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de cupones"""
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    
    def get_permissions(self):
        if self.action in ['validate', 'apply']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CouponDetailSerializer
        return CouponSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        is_active = self.request.query_params.get('is_active')
        discount_type = self.request.query_params.get('discount_type')
        search = self.request.query_params.get('search')
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        if discount_type:
            queryset = queryset.filter(discount_type=discount_type)
        
        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def validate(self, request):
        """Validar un cupón sin aplicarlo"""
        serializer = ValidateCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code'].upper()
        subtotal = serializer.validated_data.get('subtotal', 0)
        
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response(
                {'valid': False, 'message': 'Cupón no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar validez del cupón
        is_valid, message = coupon.is_valid()
        if not is_valid:
            return Response({'valid': False, 'message': message})
        
        # Verificar compra mínima
        if subtotal and subtotal < coupon.minimum_purchase:
            return Response({
                'valid': False,
                'message': f'Compra mínima de S/ {coupon.minimum_purchase} requerida'
            })
        
        # Verificar si el usuario puede usarlo
        if request.user and request.user.is_authenticated:
            can_use, user_message = coupon.can_be_used_by_user(request.user)
            if not can_use:
                return Response({'valid': False, 'message': user_message})
        
        # Calcular descuento
        discount = coupon.calculate_discount(subtotal) if subtotal else 0
        
        return Response({
            'valid': True,
            'message': 'Cupón válido',
            'coupon': {
                'code': coupon.code,
                'description': coupon.description,
                'discount_type': coupon.discount_type,
                'discount_value': float(coupon.discount_value),
                'discount_amount': float(discount),
                'minimum_purchase': float(coupon.minimum_purchase),
            }
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def apply(self, request):
        """Aplicar un cupón al carrito del usuario"""
        serializer = ApplyCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code'].upper()
        
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response(
                {'error': 'Cupón no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar validez
        is_valid, message = coupon.is_valid()
        if not is_valid:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si el usuario puede usarlo
        can_use, user_message = coupon.can_be_used_by_user(request.user)
        if not can_use:
            return Response({'error': user_message}, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener carrito
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response(
                {'error': 'Carrito vacío'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subtotal = cart.get_total()
        
        # Verificar compra mínima
        if subtotal < coupon.minimum_purchase:
            return Response({
                'error': f'Compra mínima de S/ {coupon.minimum_purchase} requerida'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar aplicabilidad a productos
        cart_items = cart.items.all()
        if not coupon.is_applicable_to_products(cart_items):
            return Response({
                'error': 'Este cupón no aplica a los productos de tu carrito'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calcular descuento
        discount = coupon.calculate_discount(subtotal)
        
        # Guardar cupón en el carrito
        cart.coupon_code = code
        cart.discount_amount = discount
        cart.save()
        
        return Response({
            'message': 'Cupón aplicado exitosamente',
            'discount': float(discount),
            'new_total': float(subtotal - discount)
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activar/desactivar cupón"""
        coupon = self.get_object()
        coupon.is_active = not coupon.is_active
        coupon.save()
        
        return Response({
            'message': f'Cupón {"activado" if coupon.is_active else "desactivado"}',
            'is_active': coupon.is_active
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Estadísticas de cupones"""
        total = Coupon.objects.count()
        active = Coupon.objects.filter(is_active=True).count()
        expired = Coupon.objects.filter(valid_until__lt=timezone.now()).count()
        
        usage_stats = CouponUsage.objects.aggregate(
            total_uses=Count('id'),
            total_discount=Sum('discount_amount')
        )
        
        return Response({
            'total_coupons': total,
            'active_coupons': active,
            'expired_coupons': expired,
            'total_uses': usage_stats['total_uses'] or 0,
            'total_discount_given': float(usage_stats['total_discount'] or 0)
        })


class CouponUsageViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para ver historial de uso de cupones"""
    queryset = CouponUsage.objects.select_related('coupon', 'user', 'order')
    serializer_class = CouponUsageSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtros
        coupon_id = self.request.query_params.get('coupon_id')
        user_id = self.request.query_params.get('user_id')
        
        if coupon_id:
            queryset = queryset.filter(coupon_id=coupon_id)
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        return queryset.order_by('-used_at')
