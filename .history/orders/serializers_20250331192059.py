from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from products.serializers import ProductSerializer
from products.models import Product
import datetime
import re

def validate_phone(value):
    """Validação de número de telefone"""
    if not re.match(r'^\+?[0-9]{10,15}$', value):
        raise serializers.ValidationError("Formato de telefone inválido.")
    return value

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        source='product', 
        write_only=True
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'user', 'items', 'total', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'subtotal']
        read_only_fields = ['subtotal']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    delivery_type_display = serializers.CharField(source='get_delivery_type_display', read_only=True)
    phone = serializers.CharField(validators=[validate_phone])
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'full_name', 'email', 'phone', 'address', 'apartment', 'building',
            'total', 'status', 'status_display', 'delivery_type', 'delivery_type_display',
            'delivery_date', 'delivery_time_slot', 'notes', 'items', 'created_at', 'updated_at',
            'payment_id', 'payment_method', 'tracking_number', 'estimated_delivery', 'cancellation_reason'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at', 'payment_id', 'payment_method', 
                           'tracking_number', 'estimated_delivery', 'cancellation_reason']
    
    def validate_delivery_date(self, value):
        """Validar que a data de entrega não é no passado"""
        if value < datetime.date.today():
            raise serializers.ValidationError("A data de entrega não pode ser no passado.")
        return value
    
    def validate(self, data):
        """Validações cross-field"""
        if data.get('delivery_type') == 'emergency' and 'delivery_time_slot' in data:
            # Para entregas de emergência, verificar restrições especiais
            current_hour = datetime.datetime.now().hour
            try:
                delivery_start = int(data['delivery_time_slot'].split(':')[0])
                
                if delivery_start - current_hour > 2:
                    raise serializers.ValidationError({
                        'delivery_time_slot': "Para entregas de emergência, o horário deve ser dentro de 2 horas."
                    })
            except (ValueError, IndexError):
                # Em caso de erro no formato, não validamos
                pass
        
        return data