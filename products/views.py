from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import rest_framework as df_filters
from django.db.models import Q, Avg
from .models import Category, Product, ProductImage, ProductReview
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer, ProductReviewSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True, reviews_enabled=False)  # Adicione reviews_enabled=False
        # Resto do código permanece o mesmo

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
        if value:
            return queryset.filter(stock__gt=0)
        return queryset

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para listar e recuperar categorias"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para listar e recuperar produtos com filtros avançados"""
    queryset = Product.objects.all()  # Adicionado queryset explícito
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku', 'category__name']
    ordering_fields = ['price', 'created_at', 'name', 'stock']
    
    def get_queryset(self):
        """Retorna produtos ativos e permite filtragem por pesquisa de texto"""
        queryset = Product.objects.filter(is_active=True)
        
        # Adicionar prefetch_related para otimizar consultas
        queryset = queryset.select_related('category').prefetch_related('images', 'reviews')
        
        # Filtrar por pesquisa de texto em múltiplos campos se o parâmetro 'q' estiver presente
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
        ).order_by('-reviews__rating', '-created_at')[:8]  # Limitar a 8 produtos
        
        # Garantir que não haja duplicatas
        featured_products = featured_products.distinct()
        
        serializer = self.get_serializer(featured_products, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Endpoint de pesquisa avançada para produtos"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Aplicar paginação
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class ProductReviewViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar avaliações de produtos"""
    serializer_class = ProductReviewSerializer
    
    def get_queryset(self):
        """
        Retorna todas as avaliações aprovadas, ou todas as avaliações
        para administradores.
        """
        if self.request.user.is_staff:
            return ProductReview.objects.all()
        # Para usuários normais, retorna apenas avaliações aprovadas
        return ProductReview.objects.filter(is_approved=True)
    
    def get_permissions(self):
        """
        Define permissões por ação:
        - Listar e detalhar: qualquer usuário
        - Criar: apenas usuários autenticados
        - Editar e excluir: apenas o autor ou administradores
        """
        if self.action in ['list', 'retrieve', 'product_reviews']:
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
        product_id = request.query_params.get('product_id')
        product_slug = request.query_params.get('product_slug')
    
        print(f"Buscando avaliações para o produto ID: {product_id}, Slug: {product_slug}")
    
        if not (product_id or product_slug):
             return Response(
            {"detail": "Forneça product_id ou product_slug"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Para usuários normais, filtrar apenas avaliações aprovadas
        if product_id:
             reviews = ProductReview.objects.filter(product_id=product_id)
        else:
            reviews = ProductReview.objects.filter(product__slug=product_slug)
    
        if not request.user.is_staff:
             reviews = reviews.filter(is_approved=True)
    
             print(f"Encontradas {reviews.count()} avaliações")
             serializer = self.get_serializer(reviews, many=True)
             print(f"Dados serializados: {serializer.data}")
        return Response(serializer.data)