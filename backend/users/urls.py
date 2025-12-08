from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet
from .views_sync import sync_student_data, get_sync_status
from .views_admin import UsuarioAdministrativoViewSet

router = DefaultRouter()
# Registrar rutas específicas primero
router.register(r'administrativos', UsuarioAdministrativoViewSet, basename='usuario-administrativo')
# Luego las rutas genéricas
router.register(r'usuarios', UsuarioViewSet, basename='usuario')

urlpatterns = [
    path('sync/', sync_student_data, name='sync-student'),
    path('sync/status/', get_sync_status, name='sync-status'),
    path('', include(router.urls)),
]
