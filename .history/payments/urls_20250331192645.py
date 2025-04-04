from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.CreatePaymentView.as_view(), name='create-payment'),
    path('webhook/', views.payment_webhook, name='payment-webhook'),
]