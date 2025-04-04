from django.contrib import admin
from .models import Category, Product, ProductImage, ProductReview

#####


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 3

class ProductReviewInline(admin.TabularInline):
    model = ProductReview
    extra = 0
    readonly_fields = ['user', 'rating', 'title', 'comment', 'created_at']
    fields = ['user', 'rating', 'title', 'comment', 'is_approved', 'created_at']
    can_delete = False
    
    def has_add_permission(self, request, obj=None):
        return False

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active')
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ('name',)
    list_filter = ('is_active',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'price', 'stock', 'availability', 'is_emergency', 'is_active', 'average_rating')
    list_filter = ('category', 'availability', 'is_emergency', 'is_active')
    search_fields = ('name', 'sku', 'description')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline, ProductReviewInline]
    readonly_fields = ('created_at', 'updated_at', 'average_rating', 'reviews_count')
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
        ('Avaliações', {
            'fields': ('average_rating', 'reviews_count')
        }),
        ('Datas', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def average_rating(self, obj):
        """Calcula e exibe a média das avaliações"""
        from django.db.models import Avg
        
        avg = obj.reviews.filter(is_approved=True).aggregate(
            avg_rating=Avg('rating')
        )['avg_rating']
        
        if avg:
            return f"{round(avg, 1)} / 5.0"
        return "Sem avaliações"
    average_rating.short_description = "Avaliação Média"
    
    def reviews_count(self, obj):
        """Retorna o número de avaliações do produto"""
        return obj.reviews.filter(is_approved=True).count()
    reviews_count.short_description = "Número de Avaliações"

@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'title', 'is_approved', 'created_at')
    list_filter = ('rating', 'is_approved', 'created_at')
    search_fields = ('product__name', 'user__username', 'title', 'comment')
    readonly_fields = ('product', 'user', 'rating', 'title', 'comment', 'created_at')
    actions = ['approve_reviews', 'reject_reviews']
    
    def has_add_permission(self, request):
        """Desabilitar adição manual de avaliações"""
        return False
    
    def approve_reviews(self, request, queryset):
        """Ação para aprovar avaliações em massa"""
        updated = queryset.update(is_approved=True)
        self.message_user(request, f"{updated} avaliação(ões) aprovada(s) com sucesso.")
    approve_reviews.short_description = "Aprovar avaliações selecionadas"
    
    def reject_reviews(self, request, queryset):
        """Ação para rejeitar avaliações em massa"""
        updated = queryset.update(is_approved=False)
        self.message_user(request, f"{updated} avaliação(ões) rejeitada(s) com sucesso.")
    reject_reviews.short_description = "Rejeitar avaliações selecionadas"

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