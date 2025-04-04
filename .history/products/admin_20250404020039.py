from django.contrib import admin
from .models import Category, Product, ProductImage, ProductReview

#####



#######
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'price', 'stock', 'availability', 'is_emergency', 'is_active')
    list_filter = ('category', 'availability', 'is_emergency', 'is_active')
    search_fields = ('name', 'sku', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'sku', 'category', 'description')
        }),
        ('Preço e estoque', {
            'fields': ('price', 'discount_price', 'stock', 'availability')
        }),
        ('Características', {
            'fields': ('is_emergency', 'weight', 'dimensions', 'is_active')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )