# orders/views.py
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Order, OrderItem, Cart, CartItem
from .serializers import OrderSerializer, OrderItemSerializer, CartSerializer, CartItemSerializer
from products.models import Product
from django.shortcuts import get_object_or_404

class OrderCancelView(APIView):
    """
    Endpoint para cancelamento de pedido pelo usuário
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, order_id):
        try:
            # Buscar o pedido do usuário atual
            order = Order.objects.get(id=order_id, user=request.user)
            
            # Verificar se o pedido pode ser cancelado (apenas pedidos em certos status)
            cancellable_statuses = ['CREATED', 'PAID', 'PROCESSING']
            if order.status not in cancellable_statuses:
                return Response(
                    {"detail": f"Não é possível cancelar um pedido com status '{order.get_status_display()}'"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Extrair motivo do cancelamento
            cancellation_reason = request.data.get('reason', 'Cancelado pelo cliente')
            
            # Atualizar o pedido
            order.status = 'CANCELLED'
            order.cancellation_reason = cancellation_reason
            order.updated_at = timezone.now()
            order.save()
            
            # Enviar notificação
            send_order_status_notification(order)
            
            return Response({"detail": "Pedido cancelado com sucesso"})
            
        except Order.DoesNotExist:
            return Response(
                {"detail": "Pedido não encontrado"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"Erro ao cancelar pedido: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class OrderHistoryView(generics.ListAPIView):
    """
    Retorna o histórico de pedidos do usuário autenticado
    """
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna apenas os pedidos do usuário atual"""
        return Order.objects.filter(user=self.request.user).order_by('-created_at').prefetch_related('items')


class CartView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obter ou criar carrinho do usuário"""
        cart, created = Cart.objects.prefetch_related('items__product').get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartItemCreateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Adicionar item ao carrinho"""
        cart, created = Cart.objects.get_or_create(user=request.user)
        
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        if not product_id:
            return Response({'error': 'product_id é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        
        product = get_object_or_404(Product, id=product_id)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, 
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartItemUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def put(self, request, item_id):
        """Atualizar quantidade de um item no carrinho"""
        cart = get_object_or_404(Cart, user=request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        
        quantity = request.data.get('quantity')
        if quantity is None:
            return Response({'error': 'quantity é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        
        quantity = int(quantity)
        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartItemDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, item_id):
        """Remover item do carrinho"""
        cart = get_object_or_404(Cart, user=request.user)
        cart_item = get_object_or_404(CartItem, id=item_id, cart=cart)
        cart_item.delete()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class CartClearView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        """Limpar carrinho"""
        cart = get_object_or_404(Cart, user=request.user)
        cart.items.all().delete()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)

class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'delivery_type', 'delivery_date']
    ordering_fields = ['created_at', 'delivery_date']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().prefetch_related('items')
        return Order.objects.filter(user=user).prefetch_related('items')
    
    def perform_create(self, serializer):
        # Criar pedido a partir dos dados enviados
        order = serializer.save(user=self.request.user)
        
        # Processar itens do pedido
        items_data = self.request.data.get('items', [])
        for item_data in items_data:
            product_id = item_data.get('product')
            product = get_object_or_404(Product, id=product_id)
            
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                price=item_data.get('price', product.price),
                quantity=item_data.get('quantity', 1)
            )

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all().prefetch_related('items')
        return Order.objects.filter(user=user).prefetch_related('items')

class OrdersByUserView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        user_id = self.kwargs.get('user_id')
        return Order.objects.filter(user_id=user_id).prefetch_related('items')

class OrderByPreferenceView(APIView):
    """
    Busca um pedido pelo ID da preferência do Mercado Pago
    """
    def get(self, request, preference_id):
        try:
            order = Order.objects.prefetch_related('items').get(preference_id=preference_id)
            serializer = OrderSerializer(order)
            return Response(serializer.data)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Pedido não encontrado para esta preferência."},
                status=status.HTTP_404_NOT_FOUND
            )