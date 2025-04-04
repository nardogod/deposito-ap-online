from rest_framework import serializers
from .models import Category, Product, ProductImage

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