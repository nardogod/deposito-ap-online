# Generated by Django 5.1.7 on 2025-04-04 05:26

import django.core.validators
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0002_alter_payment_options_and_more'),
        ('products', '0002_productreview'),
    ]

    operations = [
        migrations.CreateModel(
            name='Coupon',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True, verbose_name='Código')),
                ('description', models.CharField(blank=True, max_length=255, verbose_name='Descrição')),
                ('discount_type', models.CharField(choices=[('percentage', 'Percentual'), ('fixed', 'Valor Fixo')], default='percentage', max_length=20, verbose_name='Tipo de Desconto')),
                ('discount_value', models.DecimalField(decimal_places=2, max_digits=10, validators=[django.core.validators.MinValueValidator(0.01)], verbose_name='Valor do Desconto')),
                ('min_purchase', models.DecimalField(decimal_places=2, default=0.0, max_digits=10, verbose_name='Valor Mínimo de Compra')),
                ('max_discount', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True, verbose_name='Valor Máximo de Desconto')),
                ('valid_from', models.DateTimeField(default=django.utils.timezone.now, verbose_name='Válido a partir de')),
                ('valid_until', models.DateTimeField(blank=True, null=True, verbose_name='Válido até')),
                ('max_uses', models.PositiveIntegerField(blank=True, null=True, verbose_name='Limite de Usos')),
                ('current_uses', models.PositiveIntegerField(default=0, verbose_name='Usos Atuais')),
                ('is_active', models.BooleanField(default=True, verbose_name='Ativo')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('categories', models.ManyToManyField(blank=True, help_text='Categorias elegíveis para este cupom', to='products.category', verbose_name='Categorias')),
                ('products', models.ManyToManyField(blank=True, help_text='Produtos específicos elegíveis para este cupom', to='products.product', verbose_name='Produtos')),
            ],
            options={
                'verbose_name': 'Cupom',
                'verbose_name_plural': 'Cupons',
                'ordering': ['-created_at'],
            },
        ),
    ]
