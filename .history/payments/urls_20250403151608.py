# payments/urls.py
from django.urls import path
from .views import CreatePaymentPreferenceView, PaymentWebhookView

urlpatterns = [
    path('create/', CreatePaymentPreferenceView.as_view(), name='create_payment_preference'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment_webhook'),
]