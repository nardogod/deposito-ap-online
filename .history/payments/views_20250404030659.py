# payments/views.py
import json
import logging
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from orders.models import Order
from .services import MercadoPagoService
from .models import Payment

###
# payments/views.py
# Adicionar estas views ao arquivo de views existente


from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import Coupon
from .serializers import CouponApplySerializer, CouponSerializer
from orders.models import Cart

class CouponApplyView(APIView):
    """
    Endpoint para aplicar um cupom de desconto
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Obter o carrinho do usuário autenticado
        try:
            cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
            cart_total = cart.total
        except Cart.DoesNotExist:
            return Response(
                {"detail": "Você não possui um carrinho ativo."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validar o código do cupom
        serializer = CouponApplySerializer(
            data=request.data,
            context={'cart_total': cart_total}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Obter o cupom validado
        coupon = serializer.context.get('coupon')
        
        # Calcular o desconto
        discount = coupon.calculate_discount(cart_total)
        
        if discount <= 0:
            return Response(
                {"detail": f"O valor mínimo para este cupom é de R$ {coupon.min_purchase}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Guardar o código do cupom na sessão para uso posterior
        request.session['coupon_code'] = coupon.code
        
        # Retornar os detalhes do cupom e o desconto calculado
        return Response({
            "coupon": CouponSerializer(coupon).data,
            "discount": discount,
            "cart_total_before": cart_total,
            "cart_total_after": cart_total - discount
        })

class CouponRemoveView(APIView):
    """
    Endpoint para remover um cupom de desconto
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        # Remover o código do cupom da sessão
        if 'coupon_code' in request.session:
            del request.session['coupon_code']
        
        return Response({"detail": "Cupom removido com sucesso."})

class CouponValidateView(APIView):
    """
    Endpoint para validar um cupom sem aplicá-lo
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        code = request.data.get('code')
        
        if not code:
            return Response(
                {"detail": "O código do cupom é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            coupon = Coupon.objects.get(code__iexact=code)
            
            if not coupon.is_valid:
                return Response(
                    {"detail": "Este cupom não é mais válido."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "coupon": CouponSerializer(coupon).data,
                "min_purchase": coupon.min_purchase
            })
                
        except Coupon.DoesNotExist:
            return Response(
                {"detail": "Cupom não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
##


logger = logging.getLogger(__name__)

class CreatePaymentPreferenceView(APIView):
    def post(self, request):
        try:
            order_id = request.data.get('order_id')
            coupon_code = request.data.get('coupon_code')
            
            if not order_id:
                return Response({'message': 'ID do pedido é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
                
            mp_service = MercadoPagoService()
            preference = mp_service.create_preference(order_id, coupon_code)
            
            return Response(preference)
            
        except Order.DoesNotExist:
            return Response({'message': 'Pedido não encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Erro ao criar preferência de pagamento: {str(e)}")
            return Response({'message': 'Erro ao processar pagamento', 'error': str(e)}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@method_decorator(csrf_exempt, name='dispatch')
class PaymentWebhookView(APIView):
    def post(self, request):
        try:
            data = json.loads(request.body)
            logger.info(f"Webhook recebido: {data}")
            
            mp_service = MercadoPagoService()
            result = mp_service.process_webhook(data)
            
            return Response({'message': result})
            
        except json.JSONDecodeError:
            return Response({'message': 'Dados de webhook inválidos'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Erro ao processar webhook: {str(e)}")
            return Response({'message': 'Erro ao processar webhook', 'error': str(e)}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)