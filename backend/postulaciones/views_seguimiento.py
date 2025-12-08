"""
Views para seguimiento de becas
"""
import logging
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema

from .models import SeguimientoBeca, Postulacion
from .serializers import SeguimientoBecaSerializer
from authentication.permissions import IsEstudianteBecado, IsResponsable
from users.models import Usuario

logger = logging.getLogger(__name__)


class SeguimientoBecaEstudianteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para seguimiento de becas (estudiantes becados)
    Los estudiantes solo pueden ver y crear sus propios seguimientos
    """
    serializer_class = SeguimientoBecaSerializer
    permission_classes = [IsAuthenticated, IsEstudianteBecado]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['titulo', 'descripcion']
    filterset_fields = ['estado', 'tipo_documento']
    ordering_fields = ['fecha_subida', 'fecha_actualizacion']
    ordering = ['-fecha_subida']
    
    def get_queryset(self):
        """Solo seguimientos del estudiante autenticado"""
        return SeguimientoBeca.objects.filter(
            postulacion__estudiante=self.request.user
        ).select_related(
            'postulacion__estudiante',
            'postulacion__convocatoria',
            'postulacion__tipo_beca_solicitada',
            'revisado_por'
        )
    
    @extend_schema(
        summary="Listar postulaciones aprobadas del estudiante",
        description="Retorna las postulaciones aprobadas del estudiante para poder crear seguimientos"
    )
    @action(detail=False, methods=['get'])
    def mis_becas_aprobadas(self, request):
        """Listar becas aprobadas del estudiante"""
        postulaciones = Postulacion.objects.filter(
            estudiante=request.user,
            estado='APROBADO'
        ).select_related('convocatoria', 'tipo_beca_solicitada')
        
        data = []
        for post in postulaciones:
            data.append({
                'id': str(post.id),
                'convocatoria_titulo': post.convocatoria.titulo,
                'tipo_beca': post.tipo_beca_solicitada.nombre,
                'fecha_aprobacion': post.fecha_actualizacion,
                'tiene_seguimientos': post.seguimientos.exists(),
                'cantidad_seguimientos': post.seguimientos.count()
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    def perform_create(self, serializer):
        """Asegurar que el seguimiento sea del estudiante autenticado"""
        postulacion = serializer.validated_data['postulacion']
        
        # Verificar que la postulación pertenece al estudiante
        if postulacion.estudiante != self.request.user:
            raise ValueError("No puede crear seguimiento de una postulación que no le pertenece")
        
        serializer.save()


class SeguimientoBecaResponsableViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para seguimiento de becas (responsables)
    Los responsables pueden ver todos los seguimientos y marcarlos como revisados
    """
    serializer_class = SeguimientoBecaSerializer
    permission_classes = [IsAuthenticated, IsResponsable]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['titulo', 'descripcion', 'postulacion__estudiante__nombre']
    filterset_fields = ['estado', 'tipo_documento', 'postulacion__convocatoria']
    ordering_fields = ['fecha_subida', 'fecha_actualizacion', 'fecha_revision']
    ordering = ['-fecha_subida']
    
    def get_queryset(self):
        """Todos los seguimientos"""
        return SeguimientoBeca.objects.all().select_related(
            'postulacion__estudiante__perfil_estudiante',
            'postulacion__convocatoria',
            'postulacion__tipo_beca_solicitada',
            'revisado_por'
        )
    
    @extend_schema(
        summary="Marcar seguimiento como revisado",
        description="Marca un seguimiento como revisado y permite agregar observaciones"
    )
    @action(detail=True, methods=['post'])
    def marcar_revisado(self, request, pk=None):
        """Marcar seguimiento como revisado"""
        seguimiento = self.get_object()
        observaciones = request.data.get('observaciones', '')
        
        seguimiento.estado = 'REVISADO'
        seguimiento.observaciones_responsable = observaciones
        seguimiento.revisado_por = request.user
        seguimiento.fecha_revision = timezone.now()
        seguimiento.save()
        
        serializer = self.get_serializer(seguimiento)
        return Response({
            'message': 'Seguimiento marcado como revisado',
            'seguimiento': serializer.data
        }, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="Marcar seguimiento como observado",
        description="Marca un seguimiento como observado con comentarios para el estudiante"
    )
    @action(detail=True, methods=['post'])
    def marcar_observado(self, request, pk=None):
        """Marcar seguimiento como observado"""
        seguimiento = self.get_object()
        observaciones = request.data.get('observaciones')
        
        if not observaciones:
            return Response({
                'error': 'Debe proporcionar observaciones'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        seguimiento.estado = 'OBSERVADO'
        seguimiento.observaciones_responsable = observaciones
        seguimiento.revisado_por = request.user
        seguimiento.fecha_revision = timezone.now()
        seguimiento.save()
        
        serializer = self.get_serializer(seguimiento)
        return Response({
            'message': 'Seguimiento marcado como observado',
            'seguimiento': serializer.data
        }, status=status.HTTP_200_OK)
    
    @extend_schema(
        summary="Listar estudiantes becados",
        description="Retorna lista de estudiantes con becas aprobadas"
    )
    @action(detail=False, methods=['get'])
    def estudiantes_becados(self, request):
        """Listar estudiantes con becas aprobadas"""
        postulaciones = Postulacion.objects.filter(
            estado='APROBADO'
        ).select_related(
            'estudiante__perfil_estudiante',
            'convocatoria',
            'tipo_beca_solicitada'
        ).order_by('estudiante__nombre')
        
        # Agrupar por estudiante
        estudiantes_dict = {}
        for post in postulaciones:
            estudiante_id = str(post.estudiante.id)
            if estudiante_id not in estudiantes_dict:
                estudiantes_dict[estudiante_id] = {
                    'id': estudiante_id,
                    'nombre': post.estudiante.nombre,
                    'correo': post.estudiante.correo,
                    'registro_universitario': post.estudiante.perfil_estudiante.registro_universitario if hasattr(post.estudiante, 'perfil_estudiante') else None,
                    'becas': [],
                    'total_seguimientos': 0
                }
            
            total_seguimientos = post.seguimientos.count()
            estudiantes_dict[estudiante_id]['becas'].append({
                'id': str(post.id),
                'convocatoria': post.convocatoria.titulo,
                'tipo_beca': post.tipo_beca_solicitada.nombre,
                'fecha_aprobacion': post.fecha_actualizacion,
                'cantidad_seguimientos': total_seguimientos
            })
            estudiantes_dict[estudiante_id]['total_seguimientos'] += total_seguimientos
        
        return Response(list(estudiantes_dict.values()), status=status.HTTP_200_OK)
