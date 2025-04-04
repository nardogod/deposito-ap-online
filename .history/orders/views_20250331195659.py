from rest_framework import viewsets, generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
#from ratelimit.decorators import ratelimit
from .models import Cart, CartItem, Order, OrderItem
from .serializers import CartSerializer, CartItemSerializer, OrderSerializer, OrderItemSerializer
from products.models import Product



class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart

class CartItemView(generics.CreateAPIView, generics.DestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        cart = Cart.objects.get(user=self.request.user)
        return CartItem.objects.filter(cart=cart)
    
    def perform_create(self, serializer):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        product = serializer.validated_data['product']
        
        # Verificar se o item já existe no carrinho
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': serializer.validated_data['quantity']}
        )
        
        # Se o item já existe, atualizar a quantidade
        if not created:
            cart_item.quantity += serializer.validated_data['quantity']
            cart_item.save()
    
    def destroy(self, request, *args, **kwargs):
        cart_item = self.get_object()
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'head', 'options']  # Métodos permitidos
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, format=None):
        # Obter o carrinho do usuário
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart_items = CartItem.objects.filter(cart=cart)
        
        # Verificar se o carrinho está vazio
        if not cart_items.exists():
            return Response(
                {"detail": "Seu carrinho está vazio."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calcular o total do pedido
        total = sum(item.product.price * item.quantity for item in cart_items)
        
        # Criar dados para o novo pedido
        data = request.data.copy()
        data['user'] = request.user.id
        data['total'] = total
        
        # Criar o pedido
        serializer = OrderSerializer(data=data)
        if serializer.is_valid():
            order = serializer.save(user=request.user)
            
            # Transferir itens do carrinho para o pedido
            for cart_item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    price=cart_item.product.price,
                    quantity=cart_item.quantity
                )
            
            # Limpar o carrinho
            cart_items.delete()
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, order_id, format=None):
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {"detail": "Pedido não encontrado."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_status = request.data.get('status')
        reason = request.data.get('reason', '')
        
        # Verificar se o status é válido
        valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {"detail": "Status inválido."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar restrições específicas
        if new_status == 'cancelled' and not order.can_cancel():
            return Response(
                {"detail": "Este pedido não pode ser cancelado."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Atualizar o status
        order.update_status(new_status, reason)
        
        return Response(
            {"detail": "Status atualizado com sucesso."},
            status=status.HTTP_200_OK
        )