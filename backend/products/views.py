from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.exceptions import NotFound
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg
from .models import Category, Brand, Product, ProductImage, Review
from .serializers import (
    CategorySerializer, BrandSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ProductWriteSerializer, ReviewSerializer
)


class IsAdminOrReadOnly(IsAuthenticatedOrReadOnly):
    """
    Permiso personalizado: Solo admins pueden escribir, todos pueden leer
    """
    def has_permission(self, request, view):
        # Permitir GET, HEAD, OPTIONS sin autenticación
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        # Para POST, PUT, PATCH, DELETE: requiere staff
        return request.user and request.user.is_authenticated and request.user.is_staff


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint para categorías
    GET /api/categories/ - Lista todas las categorías (paginado)
    GET /api/categories/{id}/ - Detalle de una categoría
    GET /api/categories/autocomplete/?search=term - Para autocomplete (sin paginar)
    POST /api/categories/ - Crear categoría (solo admin)
    PUT/PATCH /api/categories/{id}/ - Actualizar categoría (solo admin)
    DELETE /api/categories/{id}/ - Eliminar categoría (solo admin)
    """
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    permission_classes = [IsAdminOrReadOnly]
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


class BrandViewSet(viewsets.ModelViewSet):
    """
    API endpoint para marcas
    GET /api/brands/ - Lista todas las marcas (paginado)
    GET /api/brands/{id}/ - Detalle de una marca
    GET /api/brands/autocomplete/?search=term - Para autocomplete (sin paginar)
    POST /api/brands/ - Crear marca (solo admin)
    PUT/PATCH /api/brands/{id}/ - Actualizar marca (solo admin)
    DELETE /api/brands/{id}/ - Eliminar marca (solo admin)
    """
    queryset = Brand.objects.filter(is_active=True)
    serializer_class = BrandSerializer
    lookup_field = 'slug'
    permission_classes = [IsAdminOrReadOnly]
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


class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint para productos con CRUD completo
    GET /api/products/ - Lista todos los productos
    POST /api/products/ - Crear producto (solo admin)
    GET /api/products/{id}/ - Detalle de un producto (acepta ID o slug)
    PUT/PATCH /api/products/{id}/ - Actualizar producto (solo admin)
    DELETE /api/products/{id}/ - Eliminar producto (solo admin)
    """
    queryset = Product.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'brand', 'is_featured', 'is_active']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'sales_count', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        """
        Mostrar solo productos activos para usuarios normales,
        mostrar todos para admins
        """
        queryset = Product.objects.all()
        
        # Si no es admin, solo mostrar activos
        if not (self.request.user and self.request.user.is_staff):
            queryset = queryset.filter(is_active=True)
        
        return queryset

    def get_object(self):
        """
        Permite buscar producto por ID o slug
        """
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field or 'pk'
        lookup_value = self.kwargs.get(lookup_url_kwarg)

        if not lookup_value:
            raise NotFound('No se proporcionó un identificador válido')

        # Intentar buscar por ID si es un número
        if lookup_value.isdigit():
            obj = queryset.filter(id=int(lookup_value)).first()
        else:
            # Si no es número, buscar por slug
            obj = queryset.filter(slug=lookup_value).first()

        if obj is None:
            raise NotFound('Producto no encontrado')

        # Verificar permisos
        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        """
        Usar serializer diferente para lectura y escritura
        """
        if self.action in ['create', 'update', 'partial_update']:
            return ProductWriteSerializer
        elif self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductListSerializer

    def retrieve(self, request, *args, **kwargs):
        """Incrementar vistas al ver detalle del producto"""
        instance = self.get_object()
        
        # Solo incrementar vistas si no es admin
        if not (request.user and request.user.is_staff):
            instance.views += 1
            instance.save(update_fields=['views'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Crear producto"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """Actualizar producto"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def perform_create(self, serializer):
        """Crear producto con el usuario actual"""
        serializer.save()

    def perform_update(self, serializer):
        """Actualizar producto"""
        serializer.save()

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Obtener productos destacados"""
        products = self.get_queryset().filter(is_featured=True, is_active=True)[:8]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def on_sale(self, request):
        """Obtener productos en oferta"""
        products = self.get_queryset().filter(
            is_active=True,
            compare_price__isnull=False
        ).exclude(
            compare_price__lte=0
        )[:12]
        serializer = ProductListSerializer(products, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Búsqueda avanzada de productos"""
        query = request.query_params.get('q', '')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        category_id = request.query_params.get('category')
        brand_id = request.query_params.get('brand')

        products = self.get_queryset()

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
            serializer = ProductListSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)

        serializer = ProductListSerializer(products, many=True, context={'request': request})
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
