from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from products.views import CategoryViewSet, BrandViewSet, ProductViewSet, ReviewViewSet
from orders.views import CartViewSet, OrderViewSet, ShippingZoneViewSet, PaymentMethodViewSet, calculate_shipping, payment_methods_list
from users.views import LoginView
from permissions.views import RoleViewSet, PermissionViewSet, UserRoleViewSet, PermissionLogViewSet
from coupons.views import CouponViewSet, CouponUsageViewSet
from notifications.views import NotificationViewSet

# Router para ViewSets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'shipping-zones', ShippingZoneViewSet, basename='shipping-zone')
router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-method')

# Permissions
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'user-roles', UserRoleViewSet, basename='user-role')
router.register(r'permission-logs', PermissionLogViewSet, basename='permission-log')

# Coupons
router.register(r'coupons', CouponViewSet, basename='coupon')
router.register(r'coupon-usage', CouponUsageViewSet, basename='coupon-usage')

# Notifications
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # Authentication
    path('api/auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/', include('users.urls')),
    
    # API Router (incluye products, categories, brands, reviews, cart, orders)
    path('api/', include(router.urls)),
    
    # Shipping
    path('api/calculate-shipping/', calculate_shipping, name='calculate-shipping'),

    # Payment Methods
    path('api/payment-methods/', payment_methods_list, name='payment-methods'),

    # tus urls...
    path("mcp/", include('mcp_server.urls')),

    # Admin API
    path('api/admin/', include('admin_api.urls')),

    # Notifications Test
    path('notifications/', include('notifications.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
