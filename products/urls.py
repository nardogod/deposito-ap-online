from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('categories', views.CategoryViewSet)
router.register('reviews', views.ProductReviewViewSet, basename='product-reviews')
router.register('', views.ProductViewSet)  # O basename não é mais necessário porque adicionamos queryset

urlpatterns = [
    path('', include(router.urls)),
]