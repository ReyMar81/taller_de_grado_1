"""
Views para gestión de usuarios administrativos (solo Director)
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema, OpenApiParameter

from users.models import Usuario, PerfilInstitucional
from users.serializers import UsuarioSerializer
from authentication.permissions import IsDirector
from authentication.services import StudentRegistrationService

logger = logging.getLogger(__name__)


class UsuarioAdministrativoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios administrativos
    Solo accesible por Director
    """
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, IsDirector]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['nombre', 'correo']
    ordering_fields = ['nombre', 'fecha_creacion', 'rol']
    ordering = ['-fecha_creacion']
    
    def get_queryset(self):
        """Solo usuarios administrativos (Director, Analista, Responsable)"""
        return Usuario.objects.filter(
            rol__in=['DIRECTOR', 'ANALISTA', 'RESPONSABLE']
        ).select_related('perfil_institucional').order_by('-fecha_creacion')
    
    @extend_schema(
        summary="Crear usuario administrativo",
        description="Crea un nuevo usuario administrativo en Django y Keycloak"
    )
    def create(self, request):
        """Crear usuario administrativo"""
        data = request.data
        
        # Validar datos requeridos (simplificado)
        required_fields = ['correo', 'nombre', 'rol', 'password']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return Response({
                'error': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que el rol sea administrativo
        rol = data.get('rol')
        if rol not in ['DIRECTOR', 'ANALISTA', 'RESPONSABLE']:
            return Response({
                'error': 'El rol debe ser DIRECTOR, ANALISTA o RESPONSABLE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que el correo no exista
        if Usuario.objects.filter(correo=data['correo']).exists():
            return Response({
                'error': 'Ya existe un usuario con ese correo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Crear usuario en Keycloak
            keycloak_service = StudentRegistrationService()
            keycloak_user_id = self._create_keycloak_user(
                keycloak_service,
                data['correo'],
                data['nombre'],
                data['password']
            )
            
            if not keycloak_user_id:
                return Response({
                    'error': 'Error al crear usuario en Keycloak'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Asignar rol en Keycloak
            role_mapping = {
                'DIRECTOR': 'director',
                'ANALISTA': 'analista',
                'RESPONSABLE': 'responsable'
            }
            
            keycloak_role = role_mapping.get(rol)
            if keycloak_role:
                keycloak_service.assign_role_to_user(keycloak_user_id, keycloak_role)
                logger.info(f"Rol {keycloak_role} asignado en Keycloak para {data['correo']}")
            
            # Crear usuario en Django
            usuario = Usuario.objects.create_user(
                correo=data['correo'],
                nombre=data['nombre'],
                rol=rol,
                keycloak_user_id=keycloak_user_id,
                telefono=data.get('telefono'),
                is_active=True
            )
            
            # Crear perfil institucional solo si se proporcionan datos
            if data.get('cargo') or data.get('unidad'):
                PerfilInstitucional.objects.create(
                    usuario=usuario,
                    cargo=data.get('cargo', ''),
                    unidad=data.get('unidad', '')
                )
            
            serializer = self.get_serializer(usuario)
            return Response({
                'message': 'Usuario administrativo creado correctamente',
                'usuario': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.exception(f"Error creando usuario administrativo: {str(e)}")
            return Response({
                'error': f'Error al crear usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Actualizar rol de usuario",
        description="Actualiza el rol de un usuario administrativo en Django y Keycloak"
    )
    @action(detail=True, methods=['post'])
    def cambiar_rol(self, request, pk=None):
        """Cambiar rol de un usuario administrativo"""
        usuario = self.get_object()
        nuevo_rol = request.data.get('rol')
        
        # Validar que el nuevo rol sea administrativo
        if nuevo_rol not in ['DIRECTOR', 'ANALISTA', 'RESPONSABLE']:
            return Response({
                'error': 'El rol debe ser DIRECTOR, ANALISTA o RESPONSABLE'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            rol_anterior = usuario.rol
            
            # Actualizar rol en Django
            usuario.rol = nuevo_rol
            usuario.save()
            
            # Actualizar rol en Keycloak
            if usuario.keycloak_user_id:
                keycloak_service = StudentRegistrationService()
                
                role_mapping = {
                    'DIRECTOR': 'director',
                    'ANALISTA': 'analista',
                    'RESPONSABLE': 'responsable'
                }
                
                # Asignar nuevo rol
                nuevo_keycloak_rol = role_mapping.get(nuevo_rol)
                if nuevo_keycloak_rol:
                    keycloak_service.assign_role_to_user(
                        usuario.keycloak_user_id,
                        nuevo_keycloak_rol
                    )
                    logger.info(f"Rol {nuevo_keycloak_rol} asignado en Keycloak para {usuario.correo}")
            
            serializer = self.get_serializer(usuario)
            return Response({
                'message': f'Rol cambiado de {rol_anterior} a {nuevo_rol}',
                'usuario': serializer.data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error cambiando rol: {str(e)}")
            return Response({
                'error': f'Error al cambiar rol: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Gestionar roles múltiples",
        description="Asigna y quita roles de un usuario en Keycloak"
    )
    @action(detail=True, methods=['post'])
    def gestionar_roles(self, request, pk=None):
        """Gestionar roles múltiples de un usuario en Keycloak"""
        usuario = self.get_object()
        roles_asignar = request.data.get('roles_asignar', [])
        roles_quitar = request.data.get('roles_quitar', [])
        
        # Validar que todos los roles sean administrativos
        roles_validos = ['DIRECTOR', 'ANALISTA', 'RESPONSABLE']
        todos_roles = roles_asignar + roles_quitar
        roles_invalidos = [r for r in todos_roles if r not in roles_validos]
        
        if roles_invalidos:
            return Response({
                'error': f'Roles inválidos: {", ".join(roles_invalidos)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not usuario.keycloak_user_id:
            return Response({
                'error': 'Usuario no tiene ID de Keycloak'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            keycloak_service = StudentRegistrationService()
            
            role_mapping = {
                'DIRECTOR': 'director',
                'ANALISTA': 'analista',
                'RESPONSABLE': 'responsable'
            }
            
            roles_asignados = []
            roles_quitados = []
            roles_fallidos = []
            
            # Asignar roles
            for rol in roles_asignar:
                keycloak_rol = role_mapping.get(rol)
                if keycloak_rol:
                    success = keycloak_service.assign_role_to_user(
                        usuario.keycloak_user_id,
                        keycloak_rol
                    )
                    if success:
                        roles_asignados.append(rol)
                        logger.info(f"Rol {keycloak_rol} asignado en Keycloak para {usuario.correo}")
                    else:
                        roles_fallidos.append(f"{rol} (asignar)")
            
            # Quitar roles
            for rol in roles_quitar:
                keycloak_rol = role_mapping.get(rol)
                if keycloak_rol:
                    success = keycloak_service.remove_role_from_user(
                        usuario.keycloak_user_id,
                        keycloak_rol
                    )
                    if success:
                        roles_quitados.append(rol)
                        logger.info(f"Rol {keycloak_rol} quitado en Keycloak para {usuario.correo}")
                    else:
                        roles_fallidos.append(f"{rol} (quitar)")
            
            return Response({
                'message': 'Roles gestionados correctamente',
                'roles_asignados': roles_asignados,
                'roles_quitados': roles_quitados,
                'roles_fallidos': roles_fallidos if roles_fallidos else None
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error gestionando roles: {str(e)}")
            return Response({
                'error': f'Error al gestionar roles: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        summary="Desactivar usuario",
        description="Desactiva un usuario administrativo (soft delete)"
    )
    @action(detail=True, methods=['post'])
    def desactivar(self, request, pk=None):
        """Desactivar usuario administrativo"""
        usuario = self.get_object()
        
        # No permitir que el director se desactive a sí mismo
        if usuario.id == request.user.id:
            return Response({
                'error': 'No puedes desactivar tu propia cuenta'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            usuario.is_active = False
            usuario.save()
            
            # TODO: También desactivar en Keycloak si se requiere
            
            return Response({
                'message': f'Usuario {usuario.nombre} desactivado correctamente'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.exception(f"Error desactivando usuario: {str(e)}")
            return Response({
                'error': f'Error al desactivar usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _create_keycloak_user(self, keycloak_service, email, nombre, password):
        """Crear usuario en Keycloak"""
        try:
            # Obtener token de admin
            admin_token = keycloak_service._get_admin_token()
            if not admin_token:
                logger.error("No se pudo obtener token de admin")
                return None
            
            # Preparar datos del usuario
            user_data = {
                "username": email,
                "email": email,
                "firstName": nombre.split()[0] if nombre else "",
                "lastName": " ".join(nombre.split()[1:]) if len(nombre.split()) > 1 else "",
                "enabled": True,
                "emailVerified": True,
                "credentials": [{
                    "type": "password",
                    "value": password,
                    "temporary": False
                }]
            }
            
            # Crear usuario en Keycloak
            import requests
            headers = {
                'Authorization': f'Bearer {admin_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{keycloak_service.keycloak_url}/admin/realms/{keycloak_service.realm}/users",
                json=user_data,
                headers=headers
            )
            
            if response.status_code != 201:
                logger.error(f"Error creando usuario en Keycloak: {response.text}")
                return None
            
            # Obtener ID del usuario creado
            location = response.headers.get('Location')
            user_id = location.split('/')[-1] if location else None
            
            return user_id
            
        except Exception as e:
            logger.exception(f"Error creando usuario en Keycloak: {str(e)}")
            return None
