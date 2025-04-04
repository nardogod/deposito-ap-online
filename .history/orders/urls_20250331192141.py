from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('history', views.OrderViewSet, basename='order')

urlpatterns = [
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/items/', views.CartItemView.as_view(), name='cart-item-add'),
    path('cart/items/<int:pk>/', views.CartItemView.as_view(), name='cart-item-delete'),
    path('create/', views.OrderCreateView.as_view(), name='order-create'),
    path('<int:order_id>/status/', views.OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('', include(router.urls)),
]