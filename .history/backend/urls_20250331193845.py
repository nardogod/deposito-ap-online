# backend/urls.py
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/orders/', include('orders.urls')),
    #path('api/docs/', include_docs_urls(title='Depósito AP Online API')),
    path('api/payments/', include('payments.urls')),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)