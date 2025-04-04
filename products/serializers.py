from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductReview
from .models import ProductReview


# products/serializers.py
# Atualização do ProductSerializer existente

class ProductReviewSerializer(serializers.ModelSerializer):
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user', 'username', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'user', 'username']
        
    def get_username(self, obj):
        return obj.user.username
    
    def create(self, validated_data):
        user = self.context['request'].user
        if ProductReview.objects.filter(user=user, product=validated_data['product']).exists():
            raise serializers.ValidationError({"detail": "Você já avaliou este produto."})
        
        validated_data['user'] = user
        return super().create(validated_data)

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_main']

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    reviews_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'sku', 'category', 'category_name', 'description', 
                  'price', 'discount_price', 'stock', 'availability', 'is_emergency', 
                  'weight', 'dimensions', 'is_active', 'images', 'reviews', 'average_rating',
                  'reviews_count']
    
    def get_average_rating(self, obj):
        """Calcula a média das avaliações do produto"""
        if not obj.reviews.exists():
            return None
        
        avg = obj.reviews.filter(is_approved=True).aggregate(
            avg_rating=models.Avg('rating')
        )['avg_rating']
        
        return round(avg, 1) if avg else None
    
    def get_reviews_count(self, obj):
        """Retorna o número de avaliações aprovadas do produto"""
        return obj.reviews.filter(is_approved=True).count()
        
class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'products_count']
        
    def get_products_count(self, obj):
        return obj.products.count()
    
  


class ProductReviewSerializer(serializers.ModelSerializer):
    """Serializer para avaliações de produtos"""
    username = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user', 'username', 'rating', 'title', 'comment', 'created_at']
        read_only_fields = ['id', 'created_at', 'user', 'username']
        
    def get_username(self, obj):
        """Retorna o nome de usuário do autor da avaliação"""
        return obj.user.username
    
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

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_main']

class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'sku', 'category', 'category_name', 'description', 
                  'price', 'discount_price', 'stock', 'availability', 'is_emergency', 
                  'weight', 'dimensions', 'is_active', 'images']
        
class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'products_count']
        
    def get_products_count(self, obj):
        return obj.products.count()