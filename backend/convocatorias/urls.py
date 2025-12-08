"""
URLs para el módulo de convocatorias
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ConvocatoriaViewSet,
    TipoBecaViewSet,
    CupoConvocatoriaViewSet,
    RequisitoDocumentoViewSet
)

router = DefaultRouter()
router.register('convocatorias', ConvocatoriaViewSet, basename='convocatoria')
router.register('tipos-beca', TipoBecaViewSet, basename='tipo-beca')
router.register('cupos', CupoConvocatoriaViewSet, basename='cupo')
router.register('requisitos', RequisitoDocumentoViewSet, basename='requisito')

app_name = 'convocatorias'

urlpatterns = [
    path('', include(router.urls)),
]
