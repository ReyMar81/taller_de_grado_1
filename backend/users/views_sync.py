"""
Views para sincronización institucional
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse

from users.models import Usuario
from users.services import InstitutionalSyncService
from users.serializers_sync import (
    SyncRequestSerializer,
    SyncResponseSerializer,
    SyncStatusSerializer
)
from authentication.permissions import IsEstudiante


@extend_schema(
    summary="Sincronizar datos institucionales del estudiante",
    description="Sincroniza los datos del estudiante desde el sistema institucional de la universidad",
    request=SyncRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=SyncResponseSerializer,
            description="Sincronización exitosa"
        ),
        400: OpenApiResponse(description="Datos inválidos"),
        403: OpenApiResponse(description="No tiene permisos"),
        500: OpenApiResponse(description="Error del servidor")
    },
    tags=['Sincronización']
)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsEstudiante])
def sync_student_data(request):
    """
    Sincroniza los datos de un estudiante desde el sistema institucional
    
    Solo los estudiantes pueden ejecutar esta acción para sincronizar sus propios datos.
    """
    serializer = SyncRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    registro_universitario = serializer.validated_data['registro_universitario']
    usuario = request.user
    
    # Inicializar servicio de sincronización
    sync_service = InstitutionalSyncService()
    
    # Ejecutar sincronización
    success, message, data = sync_service.sync_student_data(usuario, registro_universitario)
    
    if success:
        return Response({
            'success': True,
            'message': message,
            'data': data
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'success': False,
            'message': message,
            'data': None
        }, status=status.HTTP_400_BAD_REQUEST if 'no encontrado' in message.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    summary="Consultar estado de sincronización",
    description="Obtiene el estado de sincronización institucional del estudiante autenticado",
    responses={
        200: OpenApiResponse(
            response=SyncStatusSerializer,
            description="Estado de sincronización"
        ),
        403: OpenApiResponse(description="No tiene permisos")
    },
    tags=['Sincronización']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsEstudiante])
def get_sync_status(request):
    """
    Obtiene el estado de sincronización del estudiante autenticado
    
    Muestra si el estudiante tiene sus datos sincronizados con el sistema institucional.
    """
    sync_service = InstitutionalSyncService()
    sync_status_data = sync_service.get_sync_status(request.user)
    
    return Response(sync_status_data, status=status.HTTP_200_OK)
