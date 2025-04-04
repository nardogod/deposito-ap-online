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

logger = logging.getLogger(__name__)

class CreatePaymentPreferenceView(APIView):
    def post(self, request):
        try:
            order_id = request.data.get('order_id')
            
            if not order_id:
                return Response({'message': 'ID do pedido é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
                
            mp_service = MercadoPagoService()
            preference = mp_service.create_preference(order_id)
            
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