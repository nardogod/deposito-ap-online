from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth import get_user_model

User = get_user_model()

class Product(models.Model):
    # Adicione um campo para desativar reviews
    reviews_enabled = models.BooleanField(default=False)
    
class ProductReview(models.Model):
    """Modelo para avaliações de produtos por usuários"""
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text=_("Avaliação de 1 a 5 estrelas")
    )
    title = models.CharField(_("Título"), max_length=100)
    comment = models.TextField(_("Comentário"))
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)
    is_approved = models.BooleanField(_("Aprovado"), default=True)
    
    class Meta:
        verbose_name = _("Avaliação de Produto")
        verbose_name_plural = _("Avaliações de Produtos")
        ordering = ['-created_at']
        # Garantir que um usuário só possa avaliar um produto uma vez
        unique_together = ('product', 'user')
    
    def __str__(self):
        return f"Avaliação de {self.user.username} para {self.product.name}"

class Category(models.Model):
    name = models.CharField(_("Nome"), max_length=100)
    slug = models.SlugField(_("Slug"), max_length=120, unique=True)
    description = models.TextField(_("Descrição"), blank=True)
    image = models.ImageField(_("Imagem"), upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(_("Ativo"), default=True)
    
    class Meta:
        verbose_name = _("Categoria")
        verbose_name_plural = _("Categorias")
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class Product(models.Model):
    AVAILABILITY_CHOICES = (
        ('in_stock', _('Em estoque')),
        ('out_of_stock', _('Fora de estoque')),
        ('back_order', _('Sob encomenda')),
    )
    
    name = models.CharField(_("Nome"), max_length=200)
    slug = models.SlugField(_("Slug"), max_length=220, unique=True)
    sku = models.CharField(_("SKU"), max_length=50, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="products")
    description = models.TextField(_("Descrição"))
    price = models.DecimalField(_("Preço"), max_digits=10, decimal_places=2)
    discount_price = models.DecimalField(_("Preço com desconto"), max_digits=10, decimal_places=2, blank=True, null=True)
    stock = models.IntegerField(_("Estoque"), default=0)
    availability = models.CharField(_("Disponibilidade"), max_length=20, choices=AVAILABILITY_CHOICES, default='in_stock')
    is_emergency = models.BooleanField(_("Material de emergência"), default=False)
    weight = models.DecimalField(_("Peso (kg)"), max_digits=6, decimal_places=2, blank=True, null=True)
    dimensions = models.CharField(_("Dimensões"), max_length=100, blank=True)
    is_active = models.BooleanField(_("Ativo"), default=True)
    created_at = models.DateTimeField(_("Criado em"), auto_now_add=True)
    updated_at = models.DateTimeField(_("Atualizado em"), auto_now=True)
    
    class Meta:
        verbose_name = _("Produto")
        verbose_name_plural = _("Produtos")
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(_("Imagem"), upload_to='products/')
    alt_text = models.CharField(_("Texto alternativo"), max_length=200, blank=True)
    is_main = models.BooleanField(_("Imagem principal"), default=False)
    
    class Meta:
        verbose_name = _("Imagem do produto")
        verbose_name_plural = _("Imagens dos produtos")
    
    def __str__(self):
        return f"Imagem de {self.product.name}"