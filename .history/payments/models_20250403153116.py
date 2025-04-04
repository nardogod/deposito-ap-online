# payments/models.py
from django.db import models
from orders.models import Order
from django.utils import timezone

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('APPROVED', 'Aprovado'),
        ('PENDING', 'Pendente'),
        ('IN_PROCESS', 'Em Processamento'),
        ('REJECTED', 'Rejeitado'),
        ('REFUNDED', 'Reembolsado'),
        ('CANCELLED', 'Cancelado'),
        ('UNKNOWN', 'Desconhecido'),
    ]
    
    mercado_pago_id = models.CharField(max_length=255, unique=True, default="mp-id-placeholder")
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PENDING')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    payment_method = models.CharField(max_length=100, default="unknown")
    payment_type = models.CharField(max_length=100, default="unknown")
    payment_details = models.JSONField(default=dict)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment {self.mercado_pago_id} for Order {self.order.id}"