"""
Backend de autenticación con Keycloak usando JWT
"""
import requests
from jose import jwt, JWTError
from django.conf import settings
from rest_framework import authentication, exceptions
from users.models import Usuario
import logging

logger = logging.getLogger(__name__)


class KeycloakAuthentication(authentication.BaseAuthentication):
    """
    Autenticación basada en JWT de Keycloak
    """
    
    def __init__(self):
        self.keycloak_url = settings.KEYCLOAK_SERVER_URL
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self._public_key = None
    
    def get_public_key(self):
        """Obtiene la clave pública de Keycloak para validar JWT"""
        if self._public_key:
            return self._public_key
        
        try:
            url = f"{self.keycloak_url}/realms/{self.realm}/protocol/openid-connect/certs"
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            
            jwks = response.json()
            # Simplificación: tomar la primera clave
            # En producción, seleccionar por 'kid' del header JWT
            if jwks.get('keys'):
                self._public_key = jwks['keys'][0]
                return self._public_key
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Error obteniendo clave pública de Keycloak: {str(e)}')
        
        raise exceptions.AuthenticationFailed('No se pudo obtener clave pública de Keycloak')
    
    def authenticate(self, request):
        """
        Autentica la solicitud usando el token JWT de Keycloak
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.split(' ')[1]
        
        try:
            # Validar el token JWT
            payload = self.decode_token(token)
            
            # Extraer información del usuario
            keycloak_user_id = payload.get('sub')
            email = payload.get('email')
            name = payload.get('name', email)
            
            logger.info(f"Token decodificado - Email: {email}, Name: {name}, Sub: {keycloak_user_id}")
            
            if not keycloak_user_id or not email:
                raise exceptions.AuthenticationFailed('Token inválido: falta información del usuario')
            
            # Obtener o crear el usuario en la base de datos
            user = self.get_or_create_user(keycloak_user_id, email, name, payload)
            
            logger.info(f"Usuario autenticado exitosamente: {user.correo} - Rol: {user.rol}")
            
            return (user, token)
            
        except JWTError as e:
            logger.error(f"Error JWT: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Token inválido: {str(e)}')
        except Exception as e:
            logger.error(f"Error de autenticación: {str(e)}")
            raise exceptions.AuthenticationFailed(f'Error de autenticación: {str(e)}')
    
    def decode_token(self, token):
        """
        Decodifica y valida el token JWT
        """
        try:
            # Para desarrollo: decodificar sin verificar firma
            # En producción: usar la clave pública de Keycloak
            if settings.DEBUG:
                payload = jwt.decode(
                    token,
                    key=None,
                    options={"verify_signature": False, "verify_aud": False}
                )
            else:
                public_key = self.get_public_key()
                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=['RS256'],
                    audience=self.client_id
                )
            
            return payload
        except JWTError as e:
            raise exceptions.AuthenticationFailed(f'Token JWT inválido: {str(e)}')
    
    def get_or_create_user(self, keycloak_user_id, email, name, payload):
        """
        Obtiene o crea un usuario basado en el token de Keycloak
        """
        # Intentar obtener usuario existente por keycloak_user_id
        try:
            user = Usuario.objects.get(keycloak_user_id=keycloak_user_id)
            return user
        except Usuario.DoesNotExist:
            pass
        
        # Intentar obtener por email
        try:
            user = Usuario.objects.get(correo=email)
            # Asociar con Keycloak si no estaba asociado
            if not user.keycloak_user_id:
                user.keycloak_user_id = keycloak_user_id
                user.save()
            return user
        except Usuario.DoesNotExist:
            pass
        
        # Crear nuevo usuario
        # Determinar el rol basado en los roles de Keycloak
        roles = payload.get('resource_access', {}).get(self.client_id, {}).get('roles', [])
        rol = self.determine_role(roles)
        
        user = Usuario.objects.create_user(
            correo=email,
            nombre=name,
            keycloak_user_id=keycloak_user_id,
            rol=rol,
            is_active=True
        )
        
        return user
    
    def determine_role(self, keycloak_roles):
        """
        Determina el rol del usuario basado en los roles de Keycloak
        """
        # Mapeo de roles de Keycloak a roles del sistema
        role_mapping = {
            'director': Usuario.RolChoices.DIRECTOR,
            'analista': Usuario.RolChoices.ANALISTA,
            'responsable': Usuario.RolChoices.RESPONSABLE,
            'estudiante_postulante': Usuario.RolChoices.ESTUDIANTE_POSTULANTE,
            'estudiante postulante': Usuario.RolChoices.ESTUDIANTE_POSTULANTE,  # Con espacio
            'estudiante_becado': Usuario.RolChoices.ESTUDIANTE_BECADO,
            'estudiante becado': Usuario.RolChoices.ESTUDIANTE_BECADO,  # Con espacio
        }
        
        # Buscar el primer rol coincidente
        for kc_role in keycloak_roles:
            role_key = kc_role.lower().replace(' ', '_')  # Normalizar espacios a guiones bajos
            # Intentar con el rol original
            if kc_role.lower() in role_mapping:
                return role_mapping[kc_role.lower()]
            # Intentar con el rol normalizado
            if role_key in role_mapping:
                return role_mapping[role_key]
        
        logger.warning(f"No se encontró mapeo para los roles de Keycloak: {keycloak_roles}")
        # Rol por defecto
        return Usuario.RolChoices.ESTUDIANTE_POSTULANTE
