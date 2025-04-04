# orders/views.py
# Adicionar esta view ao seu arquivo de views existente

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Order
from .serializers import OrderSerializer  # Certifique-se de ter um serializador adequado

class OrderByPreferenceView(APIView):
    """
    Busca um pedido pelo ID da preferência do Mercado Pago
    """
    def get(self, request, preference_id):
        try:
            order = Order.objects.get(preference_id=preference_id)
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Pedido não encontrado para esta preferência."},
                status=status.HTTP_404_NOT_FOUND
            )