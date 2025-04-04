from django.contrib import admin

# payments/admin.py
# Adicione ao arquivo admin.py existente ou crie um novo

from django.contrib import admin
from .models import Coupon, Payment

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ['code', 'discount_type', 'discount_value', 'is_active', 'valid_from', 
                   'valid_until', 'current_uses', 'max_uses', 'is_valid']
    list_filter = ['is_active', 'discount_type', 'valid_from', 'valid_until']
    search_fields = ['code', 'description']
    readonly_fields = ['current_uses', 'created_at']
    fieldsets = (
        (None, {
            'fields': ('code', 'description', 'is_active')
        }),
        ('Regras de Desconto', {
            'fields': ('discount_type', 'discount_value', 'min_purchase', 'max_discount')
        }),
        ('Validade', {
            'fields': ('valid_from', 'valid_until', 'max_uses', 'current_uses')
        }),
        ('Restrições', {
            'fields': ('categories', 'products')
        }),
        ('Informações do Sistema', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    filter_horizontal = ('categories', 'products')
    
    def is_valid(self, obj):
        return obj.is_valid
    is_valid.boolean = True
    is_valid.short_description = 'Válido?'