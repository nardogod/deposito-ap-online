from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Product, ProductImage, ProductReview
from .serializers import CategorySerializer, ProductSerializer, ProductImageSerializer ,ProductReviewSerializer

############    ############
# products/views.py
# Adicione estas views ao arquivo views.py existente

class ProductReviewViewSet(viewsets.ModelViewSet):
    """Viewset para gerenciar avaliações de produtos"""
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
            
        # Para usuários normais, filtrar apenas avaliações aprovadas
        if request.user.is_staff:
            reviews = ProductReview.objects.filter(product_id=product_id)
        else:
            reviews = ProductReview.objects.filter(product_id=product_id, is_approved=True)
            
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

####################

###

# products/views.py
# Atualize a view de produtos para incluir filtros avançados

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend, FilterSet
from django_filters import rest_framework as df_filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer

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

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para listar e recuperar produtos com filtros avançados
    """
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku', 'category__name']
    ordering_fields = ['price', 'created_at', 'name', 'stock', 'average_rating']
    
    def get_queryset(self):
        """
        Retorna produtos ativos e permite filtragem por pesquisa de texto
        """
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
        """Endpoint para produtos em destaque (ordenados por avaliação)"""
        # Aqui podemos definir critérios para produtos em destaque
        # Por exemplo, produtos bem avaliados ou mais vendidos
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
        """
        Endpoint de pesquisa avançada para produtos
        Permite pesquisa por texto e combinação de filtros
        """
        # O método get_queryset já inclui a lógica de pesquisa básica
        queryset = self.filter_queryset(self.get_queryset())
        
        # Aplicar paginação
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

###
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    # Apenas mantenha os filtros que não dependem de templates
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'name']
    
    @action(detail=False, methods=['get'])
    def emergency(self, request):
        emergency_products = Product.objects.filter(is_emergency=True, is_active=True)
        serializer = self.get_serializer(emergency_products, many=True)
        return Response(serializer.data)