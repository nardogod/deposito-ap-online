# payments/models.py
from django.db import models
from orders.models import Order
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator


###


class Coupon(models.Model):
    """Modelo para cupons de desconto"""
    code = models.CharField(_("Código"), max_length=50, unique=True)
    description = models.CharField(_("Descrição"), max_length=255, blank=True)
    discount_type = models.CharField(
        _("Tipo de Desconto"),
        max_length=20,
        choices=[
            ('percentage', _('Percentual')),
            ('fixed', _('Valor Fixo')),
        ],
        default='percentage'
    )
    discount_value = models.DecimalField(
        _("Valor do Desconto"), 
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )
    min_purchase = models.DecimalField(
        _("Valor Mínimo de Compra"),
        max_digits=10,
        decimal_places=2,
        default=0.00
    )
    max_discount = models.DecimalField(
        _("Valor Máximo de Desconto"),
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    valid_from = models.DateTimeField(_("Válido a partir de"), default=timezone.now)
    valid_until = models.DateTimeField(_("Válido até"), null=True, blank=True)
    max_uses = models.PositiveIntegerField(_("Limite de Usos"), null=True, blank=True)
    current_uses = models.PositiveIntegerField(_("Usos Atuais"), default=0)
    is_active = models.BooleanField(_("Ativo"), default=True)
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)
    categories = models.ManyToManyField(
        'products.Category',
        verbose_name=_("Categorias"),
        blank=True,
        help_text=_("Categorias elegíveis para este cupom")
    )
    products = models.ManyToManyField(
        'products.Product',
        verbose_name=_("Produtos"),
        blank=True,
        help_text=_("Produtos específicos elegíveis para este cupom")
    )
    
    class Meta:
        verbose_name = _("Cupom")
        verbose_name_plural = _("Cupons")
        ordering = ['-created_at']
    
    def __str__(self):
        return self.code
    
    @property
    def is_valid(self):
        """Verifica se o cupom é válido na data atual e não excedeu o limite de usos"""
        now = timezone.now()
        
        # Verificar se o cupom está ativo
        if not self.is_active:
            return False
        
        # Verificar se o cupom já está válido
        if self.valid_from and now < self.valid_from:
            return False
        
        # Verificar se o cupom ainda não expirou
        if self.valid_until and now > self.valid_until:
            return False
        
        # Verificar se o cupom não excedeu o limite de usos
        if self.max_uses is not None and self.current_uses >= self.max_uses:
            return False
        
        return True
    
    def calculate_discount(self, cart_total):
        """
        Calcula o valor do desconto com base no valor total do carrinho
        """
        if not self.is_valid:
            return 0
        
        # Verificar valor mínimo de compra
        if cart_total < self.min_purchase:
            return 0
        
        # Calcular desconto
        if self.discount_type == 'percentage':
            discount = cart_total * (self.discount_value / 100)
            
            # Aplicar valor máximo de desconto, se definido
            if self.max_discount is not None:
                discount = min(discount, self.max_discount)
                
        else:  # fixed
            discount = self.discount_value
        
        # Garantir que o desconto não seja maior que o valor total
        if discount > cart_total:
            discount = cart_total
        
        return discount
    
    def apply(self):
        """Incrementa o contador de usos quando o cupom é aplicado"""
        self.current_uses += 1
        self.save(update_fields=['current_uses'])

##


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