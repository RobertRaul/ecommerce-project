from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from products.views import CategoryViewSet, BrandViewSet, ProductViewSet, ReviewViewSet
from orders.views import CartViewSet, OrderViewSet, shipping_zones_list, calculate_shipping
from users.views import LoginView

# Router para ViewSets
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'brands', BrandViewSet, basename='brand')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')

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
    
    # # Cart endpoints
    # path('api/cart/', CartViewSet.as_view({'get': 'list'}), name='cart-list'),
    # path('api/cart/add/', CartViewSet.as_view({'post': 'add'}), name='cart-add'),
    # path('api/cart/update/<int:item_id>/', CartViewSet.as_view({'put': 'update_item'}), name='cart-update'),
    # path('api/cart/remove/<int:item_id>/', CartViewSet.as_view({'delete': 'remove_item'}), name='cart-remove'),
    # path('api/cart/clear/', CartViewSet.as_view({'delete': 'clear'}), name='cart-clear'),
    #
    # # Order endpoints
    # path('api/orders/', OrderViewSet.as_view({'get': 'list'}), name='order-list'),
    # path('api/orders/<str:order_number>/', OrderViewSet.as_view({'get': 'retrieve'}), name='order-detail'),
    # path('api/orders/create/', OrderViewSet.as_view({'post': 'create_order'}), name='order-create'),
    # path('api/orders/<str:order_number>/upload-payment/', OrderViewSet.as_view({'post': 'upload_payment_proof'}), name='order-upload-payment'),
    #
    # Shipping
    path('api/shipping-zones/', shipping_zones_list, name='shipping-zones'),
    path('api/calculate-shipping/', calculate_shipping, name='calculate-shipping'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)