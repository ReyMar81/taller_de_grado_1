"""
URLs para postulaciones
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PostulacionViewSet,
    FormularioSocioeconomicoViewSet,
    FormularioAcademicoViewSet,
    DocumentoPostulacionViewSet
)
from .views_seguimiento import (
    SeguimientoBecaEstudianteViewSet,
    SeguimientoBecaResponsableViewSet
)

router = DefaultRouter()
router.register(r'postulaciones', PostulacionViewSet, basename='postulacion')
router.register(r'formularios-socioeconomicos', FormularioSocioeconomicoViewSet, basename='formulario-socioeconomico')
router.register(r'formularios-academicos', FormularioAcademicoViewSet, basename='formulario-academico')
router.register(r'documentos-postulacion', DocumentoPostulacionViewSet, basename='documento-postulacion')
router.register(r'seguimientos', SeguimientoBecaEstudianteViewSet, basename='seguimiento-estudiante')
router.register(r'seguimientos-responsable', SeguimientoBecaResponsableViewSet, basename='seguimiento-responsable')

urlpatterns = router.urls
