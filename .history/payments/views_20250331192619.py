from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from orders.models import Order
from .services import MercadoPagoService
from .models import Payment
from rest_framework.decorators import api_view, permission_classes

class CreatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, format=None):
        order_id = request.data.get('order_id')
        
        if not order_id:
            return Response(
                {"detail": "ID do pedido é obrigatório."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Pedido não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verificar se o pedido já está pago
        if order.status != 'pending_payment':
            return Response(
                {"detail": "Este pedido não está pendente de pagamento."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Criar preferência de pagamento
        try:
            mp_service = MercadoPagoService()
            preference = mp_service.create_preference(order)
            
            return Response({
                "preference_id": preference["id"],
                "init_point": preference["init_point"],
                "sandbox_init_point": preference.get("sandbox_init_point")
            })
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([])  # Sem autenticação para webhooks
def payment_webhook(request):
    """Endpoint para receber webhooks do MercadoPago"""
    try:
        mp_service = MercadoPagoService()
        payment = mp_service.process_webhook(request.data)
        
        if payment:
            return Response({"status": "success"})
        else:
            return Response({"status": "ignored"})
    except Exception as e:
        return Response(
            {"detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )