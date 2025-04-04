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