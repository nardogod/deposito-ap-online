# payments/urls.py
from django.urls import path
from .views import (
    CreatePaymentPreferenceView, 
    PaymentWebhookView,
    CouponApplyView,
    CouponRemoveView,
    CouponValidateView
)

urlpatterns = [
    path('create/', CreatePaymentPreferenceView.as_view(), name='create_payment_preference'),
    path('webhook/', PaymentWebhookView.as_view(), name='payment_webhook'),

     # Rotas para cupons
    path('coupons/apply/', CouponApplyView.as_view(), name='coupon_apply'),
    path('coupons/remove/', CouponRemoveView.as_view(), name='coupon_remove'),
    path('coupons/validate/', CouponValidateView.as_view(), name='coupon_validate'),
]
