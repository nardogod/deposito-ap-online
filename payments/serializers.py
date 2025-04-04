# payments/serializers.py
# Adicione este serializer ao arquivo serializers.py existente ou crie um novo arquivo

from rest_framework import serializers
from .models import Coupon

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = ['id', 'code', 'description', 'discount_type', 'discount_value',
                  'valid_from', 'valid_until', 'is_valid']
        read_only_fields = ['id', 'is_valid']

class CouponApplySerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    cart_total = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    def validate_code(self, value):
        """Verifica se o código do cupom existe e é válido"""
        try:
            coupon = Coupon.objects.get(code__iexact=value)
            
            if not coupon.is_valid:
                raise serializers.ValidationError("Este cupom não é mais válido.")
            
            # Salvar o cupom no contexto para uso posterior
            self.context['coupon'] = coupon
            
            return value
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Cupom não encontrado.")
    
    def validate(self, data):
        """Validação adicional baseada no valor total do carrinho"""
        coupon = self.context.get('coupon')
        cart_total = data.get('cart_total')
        
        if coupon and cart_total and cart_total < coupon.min_purchase:
            raise serializers.ValidationError({
                "cart_total": f"O valor mínimo para este cupom é de R$ {coupon.min_purchase}"
            })
        
        return data