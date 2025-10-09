from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import Category, Brand, Product, Review
from .serializers import (
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ReviewSerializer
)


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint para categorías
    GET /api/categories/ - Lista todas las categorías (paginado)
    GET /api/categories/{id}/ - Detalle de una categoría
    GET /api/categories/autocomplete/?search=term - Para autocomplete (sin paginar)
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'order']
    ordering = ['order', 'name']

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        """Endpoint para autocomplete sin paginación"""
        search = request.query_params.get('search', '')
        queryset = self.get_queryset()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(description__icontains=search)
            )

        # Limitar a 20 resultados para autocomplete
        queryset = queryset[:20]

        # Serializar solo id y name para optimizar
        data = [{'id': cat.id, 'name': cat.name, 'slug': cat.slug} for cat in queryset]
        return Response(data)

    @action(detail=True, methods=['get'])
    def products(self, request, slug=None):
        """Obtener productos de una categoría"""
        category = self.get_object()
        products = Product.objects.filter(
            category=category,
            is_active=True
        )

        serializer = ProductListSerializer(
            products,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)


class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint para marcas
    GET /api/brands/ - Lista todas las marcas (paginado)
    GET /api/brands/{id}/ - Detalle de una marca
    GET /api/brands/autocomplete/?search=term - Para autocomplete (sin paginar)
    """
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def autocomplete(self, request):
        """Endpoint para autocomplete sin paginación"""
        search = request.query_params.get('search', '')
        queryset = self.get_queryset()

        if search:
            queryset = queryset.filter(name__icontains=search)

        # Limitar a 20 resultados para autocomplete
        queryset = queryset[:20]

        # Serializar solo id y name para optimizar
        data = [{'id': brand.id, 'name': brand.name, 'slug': brand.slug} for brand in queryset]
        return Response(data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint para productos
    GET /api/products/ - Lista todos los productos (paginado)
    GET /api/products/{slug}/ - Detalle de un producto
    GET /api/products/featured/ - Productos destacados
    GET /api/products/on_sale/ - Productos en oferta
    GET /api/products/search/?q=query - Búsqueda de productos
    """
    queryset = Product.objects.filter(is_active=True)
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'is_featured']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'sales_count', 'name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        """Incrementar vistas al ver detalle del producto"""
        instance = self.get_object()
        instance.views += 1
        instance.save(update_fields=['views'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener productos destacados"""
        products = self.queryset.filter(is_featured=True)[:8]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        """Obtener productos en oferta"""
        products = self.queryset.filter(
            compare_price__isnull=False
        ).exclude(
            compare_price__lte=0
        )[:12]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Búsqueda avanzada de productos"""
        query = request.query_params.get('q', '')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        category_id = request.query_params.get('category')
        brand_id = request.query_params.get('brand')

        products = self.queryset

        if query:
            products = products.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(sku__icontains=query)
            )

        if min_price:
            products = products.filter(price__gte=min_price)

        if max_price:
            products = products.filter(price__lte=max_price)

        if category_id:
            products = products.filter(category_id=category_id)

        if brand_id:
            products = products.filter(brand_id=brand_id)

        # Paginar resultados
        page = self.paginate_queryset(products)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class ReviewViewSet(viewsets.ModelViewSet):
    """
    API endpoint para reseñas
    GET /api/reviews/ - Lista todas las reseñas
    POST /api/reviews/ - Crear una reseña (requiere autenticación)
    """
    queryset = Review.objects.filter(is_approved=True)
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'rating']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset