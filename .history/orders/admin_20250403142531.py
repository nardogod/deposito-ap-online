# orders/admin.py
from django.contrib import admin
from .models import Order, OrderItem
from cart.models import Cart, CartItem  # Importe de outro aplicativo

# Registre seus modelos aqui
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Cart)
admin.site.register(CartItem)

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
            'fields': ('user', 'status')
        }),
        ('Informações do cliente', {
            'fields': ('full_name', 'email', 'phone', 'address', 'apartment', 'building')
        }),
        ('Informações de entrega', {
            'fields': ('delivery_type', 'delivery_date', 'delivery_time_slot', 'notes')
        }),
        ('Informações financeiras', {
            'fields': ('total',)
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    