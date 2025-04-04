from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import rest_framework as df_filters
from django.db.models import Q
from .models import Category, Product, ProductReview
from .serializers import CategorySerializer, ProductSerializer, ProductReviewSerializer

class ProductReviewViewSet(viewsets.ModelViewSet):
    """Viewset para gerenciar avaliações de produtos"""
    serializer_class = ProductReviewSerializer

    def get_queryset(self):
        """Retorna todas as avaliações aprovadas ou todas para administradores"""
        if self.request.user.is_staff:
            return ProductReview.objects.all()
        return ProductReview.objects.filter(is_approved=True)

    def get_permissions(self):
        """Define permissões por ação"""
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action == 'create':
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_reviews(self, request):
        """Endpoint para listar avaliações do usuário autenticado"""
        reviews = ProductReview.objects.filter(user=request.user)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def product_reviews(self, request):
        """Endpoint para listar avaliações de um produto específico"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {"detail": "O parâmetro product_id é obrigatório"},
                status=status.HTTP_400_BAD_REQUEST
            )
        reviews = ProductReview.objects.filter(
            product_id=product_id,
            is_approved=True if not request.user.is_staff else None
        )
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class ProductFilter(FilterSet):
    """FilterSet personalizado para filtrar produtos com opções avançadas"""
    min_price = df_filters.NumberFilter(field_name="price", lookup_expr='gte')
    max_price = df_filters.NumberFilter(field_name="price", lookup_expr='lte')
    name = df_filters.CharFilter(field_name="name", lookup_expr='icontains')
    category_name = df_filters.CharFilter(field_name="category__name", lookup_expr='icontains')
    in_stock = df_filters.BooleanFilter(method='filter_in_stock')
    is_emergency = df_filters.BooleanFilter(field_name="is_emergency")

    class Meta:
        model = Product
        fields = ['category', 'min_price', 'max_price', 'name', 'category_name', 
                  'availability', 'in_stock', 'is_emergency']

    def filter_in_stock(self, queryset, name, value):
        """Filtrar produtos em estoque"""
        return queryset.filter(stock__gt=0) if value else queryset

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para listar e recuperar produtos com filtros avançados"""
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku', 'category__name']
    ordering_fields = ['price', 'created_at', 'name', 'stock', 'average_rating']

    def get_queryset(self):
        """Retorna produtos ativos com otimização de consultas"""
        queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('images', 'reviews')
        query = self.request.query_params.get('q', None)
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query) | 
                Q(sku__icontains=query) |
                Q(category__name__icontains=query)
            )
        return queryset

    @action(detail=False, methods=['get'])
    def emergency(self, request):
        """Endpoint para produtos de emergência"""
        emergency_products = Product.objects.filter(is_emergency=True, is_active=True)
        serializer = self.get_serializer(emergency_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Endpoint para produtos em destaque"""
        featured_products = Product.objects.filter(
            is_active=True,
            stock__gt=0
        ).order_by('-reviews__rating', '-created_at').distinct()[:8]
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """Endpoint de pesquisa avançada para produtos"""
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para listar e recuperar categorias"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']