# orders/urls.py
from django.urls import path
from .views import (
    OrderListCreateView, 
    OrderDetailView,
    OrdersByUserView,
    OrderByPreferenceView
)

urlpatterns = [
    path('', OrderListCreateView.as_view(), name='order-list-create'),
    path('<int:pk>/', OrderDetailView.as_view(), name='order-detail'),
    path('user/<int:user_id>/', OrdersByUserView.as_view(), name='orders-by-user'),
    path('by-preference/<str:preference_id>/', OrderByPreferenceView.as_view(), name='order-by-preference'),
]