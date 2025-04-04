# orders/urls.py
from django.urls import path
from .views import (
    OrderListCreateView, 
    OrderDetailView,
    OrdersByUserView,
    OrderByPreferenceView,
    CartView,
    CartItemCreateView,
    CartItemUpdateView,
    CartItemDeleteView,
    CartClearView
)

urlpatterns = [
    # Rotas de pedidos existentes
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('user/<int:user_id>/', OrdersByUserView.as_view(), name='orders-by-user'),
    path('by-preference/<str:preference_id>/', OrderByPreferenceView.as_view(), name='order-by-preference'),
    
    # Novas rotas para o carrinho
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:item_id>/', CartItemUpdateView.as_view(), name='cart-item-update'),
    path('cart/items/<int:item_id>/remove/', CartItemDeleteView.as_view(), name='cart-item-delete'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),
]