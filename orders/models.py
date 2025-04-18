from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product
from decimal import Decimal
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from decimal import Decimal

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

    DELIVERY_TYPE_CHOICES = [
        ('standard', 'Padrão'),
        ('express', 'Expresso'),
        ('emergency', 'Emergência'),
    ]

    # Usuário e status
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='CREATED')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='NOT_STARTED')

    # Informações financeiras
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    coupon_code = models.CharField(_("Código do Cupom"), max_length=50, blank=True, null=True)
    discount_amount = models.DecimalField(_("Valor do Desconto"), max_digits=10, decimal_places=2, default=0.00)

    # Informações do cliente
    full_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)

    # Informações de endereço
    address = models.TextField(null=True, blank=True)
    apartment = models.CharField(max_length=30, blank=True, null=True)
    building = models.CharField(max_length=100, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, null=True, blank=True)
    shipping_state = models.CharField(max_length=100, null=True, blank=True)
    shipping_postal_code = models.CharField(max_length=20, null=True, blank=True)
    shipping_country = models.CharField(max_length=100, default='Brasil')
    shipping_full_name = models.CharField(max_length=200, null=True, blank=True)

    # Informações de entrega
    delivery_type = models.CharField(max_length=20, choices=DELIVERY_TYPE_CHOICES, default='standard')
    delivery_date = models.DateField(null=True, blank=True)
    delivery_time_slot = models.CharField(max_length=50, blank=True, null=True)

    # Informações de pagamento e rastreamento
    payment_id = models.CharField(max_length=100, blank=True, null=True)
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)

    # Informações do Mercado Pago
    preference_id = models.CharField(max_length=255, null=True, blank=True)

    # Datas
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    estimated_delivery = models.DateField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    # Outras informações
    cancellation_reason = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Pedido #{self.id} - {self.user.username}"

    @property
    def total(self):
        """Calcula o total do pedido com base nos itens e descontos"""
        if hasattr(self, '_prefetched_objects_cache') and 'items' in self._prefetched_objects_cache:
            subtotal = sum(item.price * item.quantity for item in self._prefetched_objects_cache['items'])
        else:
            subtotal = sum(item.price * item.quantity for item in self.items.all())
        
        # Conversão do float para Decimal
        discount = Decimal(min(self.discount_amount or 0, subtotal))
        return subtotal - discount


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_name = models.CharField(max_length=255, default="Produto")
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} em Pedido #{self.order.id}"

    @property
    def subtotal(self):
        return self.price * self.quantity


class Cart(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Carrinho de {self.user.username}"

    @property
    def total(self):
        """Calcula o total do carrinho"""
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.quantity}x {self.product.name}"

    class Meta:
        unique_together = ('cart', 'product')

    @property
    def subtotal(self):
        """Calcula o subtotal do item"""
        if self.product:
            return self.product.price * self.quantity
        return Decimal('0.00')