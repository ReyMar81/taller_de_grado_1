from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiResponse
import logging

from .serializers import (
    ValidateStudentSerializer,
    StudentDataResponseSerializer,
    RegisterStudentSerializer,
    RegisterResponseSerializer
)
from .services import StudentRegistrationService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    """
    Verifica que el token sea válido y retorna información del usuario
    """
    from users.serializers import UsuarioDetailSerializer
    
    serializer = UsuarioDetailSerializer(request.user)
    return Response({
        'valid': True,
        'user': serializer.data
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def debug_auth(request):
    """
    Endpoint de debug para verificar headers de autenticación
    """
    auth_header = request.META.get('HTTP_AUTHORIZATION', 'No Authorization header')
    
    return Response({
        'status': 'debug',
        'authorization_header': auth_header,
        'is_authenticated': request.user.is_authenticated if hasattr(request, 'user') else False,
        'user': str(request.user) if hasattr(request, 'user') else 'No user',
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Endpoint de health check
    """
    return Response({
        'status': 'healthy',
        'service': 'DUBSS Backend',
        'version': '1.0.0'
    })


@extend_schema(
    summary="Validar registro universitario",
    description="Valida que el registro universitario exista en el sistema institucional y retorna los datos del estudiante",
    request=ValidateStudentSerializer,
    responses={
        200: OpenApiResponse(
            response=StudentDataResponseSerializer,
            description="Datos del estudiante obtenidos correctamente"
        ),
        400: OpenApiResponse(description="Datos inválidos"),
        404: OpenApiResponse(description="Registro universitario no encontrado"),
        500: OpenApiResponse(description="Error del servidor")
    },
    tags=['Registro']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def validate_student(request):
    """
    Valida que el registro universitario exista y retorna los datos institucionales
    
    Este endpoint es público y se usa antes del registro.
    """
    serializer = ValidateStudentSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    registro_universitario = serializer.validated_data['registro_universitario']
    
    # Validar con el servicio de registro
    registration_service = StudentRegistrationService()
    success, message, student_data = registration_service.validate_student(registro_universitario)
    
    if success:
        return Response({
            'success': True,
            'message': message,
            'data': student_data
        }, status=status.HTTP_200_OK)
    else:
        status_code = status.HTTP_404_NOT_FOUND if 'no encontrado' in message.lower() else status.HTTP_500_INTERNAL_SERVER_ERROR
        return Response({
            'success': False,
            'message': message
        }, status=status_code)


@extend_schema(
    summary="Registrar nuevo estudiante",
    description="Registra un nuevo estudiante en Keycloak y Django con el rol de estudiante_postulante",
    request=RegisterStudentSerializer,
    responses={
        201: OpenApiResponse(
            response=RegisterResponseSerializer,
            description="Estudiante registrado exitosamente"
        ),
        400: OpenApiResponse(description="Datos inválidos o estudiante ya registrado"),
        500: OpenApiResponse(description="Error del servidor")
    },
    tags=['Registro']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_student(request):
    """
    Registra un nuevo estudiante en el sistema
    
    Proceso:
    1. Valida datos del formulario
    2. Consulta sistema institucional
    3. Crea usuario en Keycloak con rol estudiante_postulante
    4. Crea usuario en Django con perfil sincronizado
    """
    serializer = RegisterStudentSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Extraer datos validados
    registro = serializer.validated_data['registro_universitario']
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    # Registrar estudiante
    registration_service = StudentRegistrationService()
    success, message, user_id = registration_service.register_student(
        registro,
        email,
        password
    )
    
    if success:
        return Response({
            'success': True,
            'message': message,
            'user_id': user_id,
            'email': email
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'success': False,
            'message': message
        }, status=status.HTTP_400_BAD_REQUEST)

