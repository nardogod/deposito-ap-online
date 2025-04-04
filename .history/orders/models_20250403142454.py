# orders/models.py
from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product

User = get_user_model()

class Order(models.Model):
    ORDER_STATUS_CHOICES = [
        ('CREATED', 'Criado'),
        ('PAID', 'Pago'),
        ('PROCESSING', 'Em Processamento'),
        ('SHIPPED', 'Enviado'),
        ('DELIVERED', 'Entregue'),
        ('CANCELLED', 'Cancelado'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('APPROVED', 'Aprovado'),
        ('PENDING', 'Pendente'),
        ('IN_PROCESS', 'Em Processamento'),
        ('REJECTED', 'Rejeitado'),
        ('REFUNDED', 'Reembolsado'),
        ('CANCELLED', 'Cancelado'),
        ('UNKNOWN', 'Desconhecido'),
        ('NOT_STARTED', 'Não Iniciado'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='CREATED')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='NOT_STARTED')
    
    # Informações de envio
    shipping_address = models.TextField()
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_postal_code = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default='Brasil')
    shipping_full_name = models.CharField(max_length=200)
    
    # Informações do Mercado Pago
    preference_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Datas
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Outras informações
    cancellation_reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Pedido #{self.id} - {self.user.username}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255)  # Backup do nome do produto
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name} em Pedido #{self.order.id}"
    
    def get_total(self):
        return self.price * self.quantity
    
    # orders/models.py
# Adicione ao final do arquivo (ou onde for apropriado)

class Cart(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrinho de {self.user.username}"

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    class Meta:
        unique_together = ('cart', 'product')