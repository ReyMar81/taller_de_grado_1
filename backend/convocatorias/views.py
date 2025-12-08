"""
Views para gestión de convocatorias
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiResponse

from .models import (
    Convocatoria,
    TipoBeca,
    CupoConvocatoria,
    RequisitoDocumento
)
from .serializers import (
    ConvocatoriaListSerializer,
    ConvocatoriaDetailSerializer,
    ConvocatoriaCreateUpdateSerializer,
    CambiarEstadoConvocatoriaSerializer,
    TipoBecaSerializer,
    CupoConvocatoriaSerializer,
    RequisitoDocumentoSerializer
)
from authentication.permissions import IsDirectorOrAnalista, IsEstudiante


class ConvocatoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de convocatorias
    """
    queryset = Convocatoria.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['estado', 'gestion']
    search_fields = ['titulo', 'descripcion']
    ordering_fields = ['fecha_creacion', 'fecha_inicio', 'fecha_cierre']
    ordering = ['-fecha_creacion']
    
    def get_serializer_class(self):
        """Seleccionar serializer según la acción"""
        if self.action == 'list':
            return ConvocatoriaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ConvocatoriaCreateUpdateSerializer
        return ConvocatoriaDetailSerializer
    
    def get_permissions(self):
        """Permisos según acción"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDirectorOrAnalista()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        """Filtrar convocatorias según rol"""
        user = self.request.user
        queryset = Convocatoria.objects.all()
        
        # Estudiantes solo ven convocatorias publicadas
        if user.rol in ['ESTUDIANTE_POSTULANTE', 'ESTUDIANTE_BECADO']:
            queryset = queryset.filter(estado=Convocatoria.EstadoChoices.PUBLICADA)
        
        return queryset.select_related('creado_por').prefetch_related(
            'cupos__tipo_beca',
            'requisitos'
        )
    
    def perform_create(self, serializer):
        """Asignar usuario creador"""
        serializer.save(creado_por=self.request.user)
    
    @extend_schema(
        summary="Listar convocatorias activas",
        description="Obtiene solo las convocatorias que están actualmente activas para postulaciones"
    )
    @action(detail=False, methods=['get'])
    def activas(self, request):
        """Obtener solo convocatorias activas"""
        convocatorias = self.get_queryset().filter(
            estado=Convocatoria.EstadoChoices.PUBLICADA
        )
        
        # Filtrar por las que están en periodo de postulación
        convocatorias_activas = [c for c in convocatorias if c.esta_activa]
        
        serializer = ConvocatoriaListSerializer(convocatorias_activas, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Cambiar estado de convocatoria",
        description="Cambia el estado de una convocatoria (publicar, pausar, cerrar, finalizar)",
        request=CambiarEstadoConvocatoriaSerializer,
        responses={200: ConvocatoriaDetailSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDirectorOrAnalista])
    def cambiar_estado(self, request, pk=None):
        """Cambiar el estado de una convocatoria"""
        convocatoria = self.get_object()
        
        serializer = CambiarEstadoConvocatoriaSerializer(
            data=request.data,
            context={'convocatoria': convocatoria}
        )
        
        if serializer.is_valid():
            convocatoria.estado = serializer.validated_data['estado']
            convocatoria.save()
            
            response_serializer = ConvocatoriaDetailSerializer(convocatoria)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @extend_schema(
        summary="Listar cupos de una convocatoria",
        description="Obtiene todos los cupos definidos para esta convocatoria"
    )
    @action(detail=True, methods=['get'])
    def cupos(self, request, pk=None):
        """Obtener cupos de la convocatoria"""
        convocatoria = self.get_object()
        cupos = convocatoria.cupos.all().select_related('tipo_beca')
        serializer = CupoConvocatoriaSerializer(cupos, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Listar requisitos documentales de una convocatoria",
        description="Obtiene todos los requisitos documentales para esta convocatoria"
    )
    @action(detail=True, methods=['get'])
    def requisitos(self, request, pk=None):
        """Obtener requisitos de la convocatoria"""
        convocatoria = self.get_object()
        requisitos = convocatoria.requisitos.all().order_by('orden')
        serializer = RequisitoDocumentoSerializer(requisitos, many=True)
        return Response(serializer.data)


class TipoBecaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de beca
    """
    queryset = TipoBeca.objects.filter(activo=True)
    serializer_class = TipoBecaSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'descripcion']
    ordering = ['nombre']
    
    def get_permissions(self):
        """Solo Director y Analista pueden crear/editar tipos de beca"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsDirectorOrAnalista()]
        return [IsAuthenticated()]


class CupoConvocatoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para cupos de convocatoria
    """
    queryset = CupoConvocatoria.objects.all()
    serializer_class = CupoConvocatoriaSerializer
    permission_classes = [IsAuthenticated, IsDirectorOrAnalista]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['convocatoria', 'tipo_beca', 'facultad']
    
    def get_queryset(self):
        """Filtrar por convocatoria si se especifica en query params"""
        queryset = CupoConvocatoria.objects.all()
        convocatoria_id = self.request.query_params.get('convocatoria')
        
        if convocatoria_id:
            queryset = queryset.filter(convocatoria_id=convocatoria_id)
        
        return queryset.select_related('convocatoria', 'tipo_beca')
    
    def perform_create(self, serializer):
        """Validar que la convocatoria pueda editarse"""
        convocatoria = serializer.validated_data['convocatoria']
        
        if not convocatoria.puede_editar:
            return Response(
                {'error': 'No se pueden agregar cupos a una convocatoria publicada o cerrada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer.save()


class RequisitoDocumentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para requisitos documentales
    """
    queryset = RequisitoDocumento.objects.all()
    serializer_class = RequisitoDocumentoSerializer
    permission_classes = [IsAuthenticated, IsDirectorOrAnalista]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['convocatoria', 'es_obligatorio', 'tipo_archivo']
    ordering = ['orden']
    
    def get_queryset(self):
        """Filtrar por convocatoria"""
        queryset = RequisitoDocumento.objects.all()
        convocatoria_id = self.request.query_params.get('convocatoria')
        
        if convocatoria_id:
            queryset = queryset.filter(convocatoria_id=convocatoria_id)
        
        return queryset.select_related('convocatoria')
