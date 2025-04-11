from rest_framework import serializers
from django.db.models import Avg
from .models import Category, Product, ProductImage, ProductReview

class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer para imagens de produto"""
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_main']

class CategorySerializer(serializers.ModelSerializer):
    """Serializer para categorias de produtos"""
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'products_count']
        
    def get_products_count(self, obj):
        """Retorna o número de produtos ativos na categoria"""
        return obj.products.filter(is_active=True).count()

class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer para avaliações de produtos"""
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user', 'username', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'user', 'username']
        
    def get_username(self, obj):
        """Retorna o nome de usuário do autor da avaliação"""
        if obj.user:
            return obj.user.username
        return "Usuário"
    
    def create(self, validated_data):
        """
        Cria uma avaliação associada ao usuário autenticado
        """
        user = self.context['request'].user
        # Verificar se o usuário já avaliou este produto
        if ProductReview.objects.filter(user=user, product=validated_data['product']).exists():
            raise serializers.ValidationError({"detail": "Você já avaliou este produto."})
        
        validated_data['user'] = user
        return super().create(validated_data)

class ProductSerializer(serializers.ModelSerializer):
    """Serializer completo para produtos"""
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    # Modificar a representação da categoria para ser apenas o ID
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'category', 'category_name', 'category_slug',
            'description', 'price', 'discount_price', 'stock', 'availability', 
            'is_emergency', 'weight', 'dimensions', 'is_active', 'images',
            'average_rating', 'reviews_count'
        ]
    
    def get_average_rating(self, obj):
        """Calcula a média das avaliações do produto"""
        if not obj.reviews.exists():
            return None
        
        avg = obj.reviews.filter(is_approved=True).aggregate(
            avg_rating=Avg('rating')
        )['avg_rating']
        
        return round(avg, 1) if avg else None
    
    def get_reviews_count(self, obj):
        """Retorna o número de avaliações aprovadas do produto"""
        return obj.reviews.filter(is_approved=True).count()