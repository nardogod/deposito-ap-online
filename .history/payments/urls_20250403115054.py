# payments/urls.py
from django.urls import path
from .views import CreatePaymentPreferenceView, PaymentWebhookView, OrderByPreferenceView

urlpatterns = [
    path('create/', CreatePaymentPreferenceView.as_view(), name='create_payment_preference'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment_webhook'),
    path('orders/by-preference/<str:preference_id>/', OrderByPreferenceView.as_view(), name='order_by_preference'),
]