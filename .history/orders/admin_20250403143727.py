# orders/admin.py
from django.contrib import admin
from .models import Order, OrderItem, Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ('subtotal',)

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total', 'created_at')
    readonly_fields = ('total', 'created_at', 'updated_at')
    inlines = [CartItemInline]

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('subtotal',)

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'full_name', 'status', 'delivery_type', 'delivery_date', 'total', 'created_at')
    list_filter = ('status', 'delivery_type', 'delivery_date')
    search_fields = ('full_name', 'email', 'phone', 'address')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OrderItemInline]
    fieldsets = (
        (None, {
            'fields': ('user', 'status', 'payment_status')
        }),
        ('Informações do cliente', {
            'fields': ('full_name', 'email', 'phone', 'address', 'apartment', 'building',
                      'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country')
        }),
        ('Informações de entrega', {
            'fields': ('delivery_type', 'delivery_date', 'delivery_time_slot', 'notes',
                      'tracking_number', 'estimated_delivery')
        }),
        ('Informações financeiras', {
            'fields': ('total_amount', 'payment_id', 'payment_method', 'preference_id')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at', 'shipped_at', 'delivered_at')
        }),
        ('Cancelamento', {
            'fields': ('cancellation_reason',),
            'classes': ('collapse',)
        }),
    )

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity', 'subtotal', 'added_at')
    list_filter = ('added_at',)
    search_fields = ('product__name',)

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'product_name', 'quantity', 'price', 'subtotal')
    list_filter = ('order__status',)
    search_fields = ('product_name', 'order__id')