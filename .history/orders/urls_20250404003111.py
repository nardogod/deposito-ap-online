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
    CartClearView,
    OrderHistoryView  # Nova importação
)

urlpatterns = [
    # Rotas de pedidos existentes
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('user/<int:user_id>/', OrdersByUserView.as_view(), name='orders-by-user'),
    path('by-preference/<str:preference_id>/', OrderByPreferenceView.as_view(), name='order-by-preference'),
    path('history/', OrderHistoryView.as_view(), name='order-history'),  # Nova rota
    
    # Rotas do carrinho
    path('cart/', CartView.as_view(), name='cart-detail'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:item_id>/', CartItemDeleteView.as_view(), name='cart-item-delete'),
    path('cart/items/<int:item_id>/update/', CartItemUpdateView.as_view(), name='cart-item-update'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),
]