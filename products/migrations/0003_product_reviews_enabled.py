# Generated by Django 5.1.7 on 2025-04-11 12:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0002_productreview'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='reviews_enabled',
            field=models.BooleanField(default=True, verbose_name='Avaliações habilitadas'),
        ),
    ]
