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

class OrderByPreferenceView(APIView):
    def get(self, request, preference_id):
        try:
            order = Order.objects.prefetch_related('items__product').get(preference_id=preference_id)
            
            # Aqui você pode usar um serializador para formatar a resposta
            # Por simplicidade, estamos retornando um dicionário básico
            order_data = {
                'id': order.id,
                'status': order.status,
                'payment_status': order.payment_status,
                'total_amount': float(order.total_amount),
                'created_at': order.created_at.isoformat(),
                'items': [
                    {
                        'id': item.id,
                        'product_id': item.product.id if item.product else None,
                        'product_name': item.product_name,
                        'price': float(item.price),
                        'quantity': item.quantity,
                        'total': float(item.get_total())
                    } for item in order.items.all()
                ],
                'shipping_address': {
                    'full_name': order.shipping_full_name,
                    'address': order.shipping_address,
                    'city': order.shipping_city,
                    'state': order.shipping_state,
                    'postal_code': order.shipping_postal_code,
                    'country': order.shipping_country
                }
            }
            
            return Response(order_data)
            
        except Order.DoesNotExist:
            return Response({'message': 'Pedido não encontrado para esta preferência'}, 
                           status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Erro ao buscar pedido por preferência: {str(e)}")
            return Response({'message': 'Erro ao buscar pedido', 'error': str(e)}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)