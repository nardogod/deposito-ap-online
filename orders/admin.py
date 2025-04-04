# orders/admin.py
from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Order, OrderItem, Cart, CartItem
from .notifications import send_order_status_notification

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'product_name', 'price', 'quantity', 'subtotal']
    fields = ['product', 'product_name', 'price', 'quantity', 'subtotal']
    
    def subtotal(self, obj):
        return obj.get_total()
    subtotal.short_description = 'Subtotal'
    
    def has_add_permission(self, request, obj=None):
        return False


class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_info', 'total_amount', 'status', 'payment_status', 'delivery_type', 'created_at', 'actions_buttons']
    list_filter = ['status', 'payment_status', 'delivery_type', 'created_at']
    search_fields = ['id', 'user__username', 'user__email', 'full_name', 'email', 'shipping_postal_code']
    readonly_fields = ['created_at', 'updated_at', 'total', 'preference_id', 'payment_id']
    inlines = [OrderItemInline]
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('user', 'status', 'payment_status', 'created_at', 'updated_at')
        }),
        ('Informações do Cliente', {
            'fields': ('full_name', 'email', 'phone')
        }),
        ('Endereço de Entrega', {
            'fields': ('address', 'apartment', 'building', 'shipping_city', 'shipping_state', 
                      'shipping_postal_code', 'shipping_country', 'shipping_full_name')
        }),
        ('Informações de Entrega', {
            'fields': ('delivery_type', 'delivery_date', 'delivery_time_slot', 
                      'estimated_delivery', 'shipped_at', 'delivered_at', 'tracking_number')
        }),
        ('Informações Financeiras', {
            'fields': ('total_amount', 'total', 'payment_method')
        }),
        ('Informações de Pagamento', {
            'fields': ('payment_id', 'preference_id')
        }),
        ('Observações', {
            'fields': ('notes', 'cancellation_reason')
        }),
    )
    
    def user_info(self, obj):
        if obj.user:
            user_url = reverse('admin:users_user_change', args=[obj.user.pk])
            return format_html('<a href="{}">{} ({})</a>', user_url, obj.user.username, obj.user.email)
        return '-'
    user_info.short_description = 'Usuário'
    
    def actions_buttons(self, obj):
        buttons = []
        
        # Botão para ver detalhes
        view_url = reverse('admin:orders_order_change', args=[obj.pk])
        buttons.append(f'<a class="button" href="{view_url}">Ver</a>')
        
        # Botões para atualizar status, apenas se o pedido não estiver cancelado ou entregue
        if obj.status not in ['CANCELLED', 'DELIVERED']:
            # Botão para marcar como em processamento
            if obj.status in ['CREATED', 'PAID']:
                buttons.append(f'<a class="button" style="background-color: #17a2b8;" href="javascript:void(0);" onclick="updateOrderStatus({obj.pk}, \'PROCESSING\')">Processar</a>')
            
            # Botão para marcar como enviado
            if obj.status in ['CREATED', 'PAID', 'PROCESSING']:
                buttons.append(f'<a class="button" style="background-color: #007bff;" href="javascript:void(0);" onclick="updateOrderStatus({obj.pk}, \'SHIPPED\')">Enviar</a>')
            
            # Botão para marcar como entregue
            if obj.status in ['SHIPPED']:
                buttons.append(f'<a class="button" style="background-color: #28a745;" href="javascript:void(0);" onclick="updateOrderStatus({obj.pk}, \'DELIVERED\')">Entregar</a>')
            
            # Botão para cancelar
            buttons.append(f'<a class="button" style="background-color: #dc3545;" href="javascript:void(0);" onclick="updateOrderStatus({obj.pk}, \'CANCELLED\')">Cancelar</a>')
        
        return format_html('<div class="button-container">{}</div>', ' '.join(buttons))
    actions_buttons.short_description = 'Ações'
    
    def save_model(self, request, obj, form, change):
        """Salva o modelo e envia notificações se o status foi alterado"""
        if change:  # Se for uma alteração de objeto existente
            old_obj = Order.objects.get(pk=obj.pk)
            # Verificar se o status foi alterado
            if old_obj.status != obj.status:
                # Salvar o modelo
                super().save_model(request, obj, form, change)
                # Enviar notificação
                send_order_status_notification(obj)
                self.message_user(request, f"Notificação enviada para {obj.email or obj.user.email}")
                return
        # Se não for alteração de status, salvar normalmente
        super().save_model(request, obj, form, change)
    
    def get_queryset(self, request):
        """Otimiza as consultas ao banco de dados para melhorar a performance"""
        qs = super().get_queryset(request)
        return qs.select_related('user').prefetch_related('items')

    class Media:
        js = ('js/order_admin.js',)
        css = {
            'all': ('css/order_admin.css',)
        }


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ['product', 'quantity', 'subtotal']
    readonly_fields = ['subtotal']
    
    def subtotal(self, obj):
        return obj.subtotal
    subtotal.short_description = 'Subtotal'


class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'total', 'items_count', 'created_at', 'updated_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['total', 'created_at', 'updated_at']
    inlines = [CartItemInline]
    
    def items_count(self, obj):
        return obj.items.count()
    items_count.short_description = 'Itens'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('user').prefetch_related('items')


# Registrar os modelos no admin
admin.site.register(Order, OrderAdmin)
admin.site.register(Cart, CartAdmin)