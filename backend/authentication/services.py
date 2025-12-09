"""
Servicio para gestión de registro de estudiantes con Keycloak
"""
import requests
import logging
from typing import Dict, Tuple, Optional
from django.conf import settings
from users.models import Usuario, PerfilEstudiante
from django.utils import timezone
from django.db import transaction

logger = logging.getLogger(__name__)


class StudentRegistrationService:
    """
    Servicio para registro de estudiantes con integración a Keycloak
    """
    
    def __init__(self):
        self.institutional_api_url = getattr(
            settings, 'INSTITUTIONAL_API_URL', 'http://institutional-api:8001'
        )
        self.keycloak_url = settings.KEYCLOAK_SERVER_URL
        self.realm = settings.KEYCLOAK_REALM
        self.client_id = settings.KEYCLOAK_CLIENT_ID
        self.client_secret = settings.KEYCLOAK_CLIENT_SECRET
        self.timeout = 10
    
    def validate_student(self, registro_universitario: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Valida que el registro universitario exista en el sistema institucional
        
        Args:
            registro_universitario: RU del estudiante
            
        Returns:
            Tuple[bool, str, Optional[Dict]]: (success, message, student_data)
        """
        try:
            logger.info(f"Validando RU en sistema institucional: {registro_universitario}")
            
            response = requests.get(
                f"{self.institutional_api_url}/datos/estudiante/{registro_universitario}",
                timeout=self.timeout
            )
            
            if response.status_code == 404:
                return False, "Registro universitario no encontrado", None
            
            response.raise_for_status()
            data = response.json()
            
            if data.get('type') != 'success':
                return False, "Error al obtener datos institucionales", None
            
            student_data = data.get('data')
            if not student_data:
                return False, "Datos institucionales no disponibles", None
            
            # Verificar que el estudiante esté activo
            if student_data.get('activo') != '1':
                return False, "El estudiante no está activo en el sistema institucional", None
            
            logger.info(f"Validación exitosa para RU: {registro_universitario}")
            return True, "Datos obtenidos correctamente", student_data
            
        except requests.Timeout:
            logger.error("Timeout al consultar sistema institucional")
            return False, "El sistema institucional no responde", None
        except requests.RequestException as e:
            logger.error(f"Error al consultar sistema institucional: {str(e)}")
            return False, "Error de comunicación con el sistema institucional", None
        except Exception as e:
            logger.exception(f"Error inesperado en validación: {str(e)}")
            return False, f"Error inesperado: {str(e)}", None
    
    def register_student(
        self,
        registro_universitario: str,
        email: str,
        password: str
    ) -> Tuple[bool, str, Optional[str]]:
        """
        Registra un nuevo estudiante en Keycloak y Django
        
        Args:
            registro_universitario: RU del estudiante
            email: Email del estudiante
            password: Contraseña elegida
            
        Returns:
            Tuple[bool, str, Optional[str]]: (success, message, user_id)
        """
        try:
            # 1. Validar que el RU exista en sistema institucional
            success, message, student_data = self.validate_student(registro_universitario)
            if not success:
                return False, message, None
            
            # 2. Verificar que el email no esté registrado
            if Usuario.objects.filter(correo=email).exists():
                return False, "El correo ya está registrado", None
            
            # 3. Verificar que el RU no esté registrado
            if PerfilEstudiante.objects.filter(registro_universitario=registro_universitario).exists():
                return False, "El registro universitario ya está registrado", None
            
            # 4. Crear usuario en Keycloak
            keycloak_id = self._create_keycloak_user(
                registro_universitario,
                email,
                student_data['nombre'],
                password
            )
            
            if not keycloak_id:
                return False, "Error al crear usuario en Keycloak", None
            
            # 5. Crear usuario en Django con perfil de estudiante
            with transaction.atomic():
                user = self._create_django_user(
                    keycloak_id,
                    email,
                    student_data,
                    registro_universitario
                )
                
                if not user:
                    # Si falla Django, intentar eliminar de Keycloak
                    self._delete_keycloak_user(keycloak_id)
                    return False, "Error al crear usuario en el sistema", None
            
            logger.info(f"Registro exitoso - RU: {registro_universitario}, Email: {email}")
            return True, "Registro exitoso", str(user.id)
            
        except Exception as e:
            logger.exception(f"Error en registro de estudiante: {str(e)}")
            return False, f"Error inesperado: {str(e)}", None
    
    def _get_admin_token(self) -> Optional[str]:
        """Obtiene token de administrador de Keycloak"""
        try:
            token_url = f"{self.keycloak_url}/realms/master/protocol/openid-connect/token"
            data = {
                'client_id': 'admin-cli',
                'username': 'admin',
                'password': 'admin',
                'grant_type': 'password'
            }
            
            response = requests.post(token_url, data=data, timeout=10)
            response.raise_for_status()
            
            return response.json()['access_token']
        except Exception as e:
            logger.error(f"Error obteniendo token de admin: {str(e)}")
            return None
    
    def _create_keycloak_user(
        self,
        username: str,
        email: str,
        full_name: str,
        password: str
    ) -> Optional[str]:
        """Crea usuario en Keycloak y asigna rol de 'estudiante postulante'"""
        try:
            # Obtener token de admin
            admin_token = self._get_admin_token()
            if not admin_token:
                return None
            
            # Crear usuario
            users_url = f"{self.keycloak_url}/admin/realms/{self.realm}/users"
            headers = {
                'Authorization': f'Bearer {admin_token}',
                'Content-Type': 'application/json'
            }
            
            user_data = {
                'username': username,
                'email': email,
                'firstName': full_name.split()[0] if full_name else '',
                'lastName': ' '.join(full_name.split()[1:]) if len(full_name.split()) > 1 else '',
                'enabled': True,
                'emailVerified': True,
                'credentials': [{
                    'type': 'password',
                    'value': password,
                    'temporary': False
                }]
            }
            
            response = requests.post(users_url, json=user_data, headers=headers, timeout=10)
            
            if response.status_code != 201:
                logger.error(f"Error creando usuario en Keycloak: {response.text}")
                return None
            
            # Obtener ID del usuario creado
            location = response.headers.get('Location')
            user_id = location.split('/')[-1] if location else None
            
            if not user_id:
                logger.error("No se pudo obtener ID del usuario creado")
                return None
            
            # Asignar rol de estudiante postulante
            role_assigned = self._assign_student_role(user_id)
            
            if not role_assigned:
                logger.warning(f"No se pudo asignar rol 'estudiante postulante' al usuario {user_id}")
            
            return user_id
            
        except Exception as e:
            logger.exception(f"Error creando usuario en Keycloak: {str(e)}")
            return None
    
    def _assign_student_role(self, user_id: str) -> bool:
        """Asigna el rol de 'estudiante postulante' al usuario"""
        try:
            # Obtener token de admin (nuevo, no usar uno viejo)
            admin_token = self._get_admin_token()
            if not admin_token:
                logger.error("No se pudo obtener token de admin para asignar rol")
                return False
            
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            # Obtener UUID del cliente dubss-backend
            roles_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients"
            response = requests.get(f"{roles_url}?clientId={self.client_id}", headers=headers)
            clients = response.json()
            
            if not clients:
                logger.error(f"Cliente {self.client_id} no encontrado")
                return False
            
            client_uuid = clients[0]['id']
            
            # Obtener rol estudiante postulante
            role_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients/{client_uuid}/roles/estudiante%20postulante"
            response = requests.get(role_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Rol 'estudiante postulante' no encontrado en Keycloak: {response.status_code} - {response.text}")
                return False
            
            role_data = response.json()
            
            # Asignar rol al usuario
            assign_url = f"{self.keycloak_url}/admin/realms/{self.realm}/users/{user_id}/role-mappings/clients/{client_uuid}"
            response = requests.post(
                assign_url,
                json=[role_data],
                headers={'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
            )
            
            if response.status_code == 204:
                logger.info(f"Rol 'estudiante postulante' asignado correctamente al usuario {user_id}")
                return True
            else:
                logger.error(f"Error asignando rol 'estudiante postulante': {response.status_code} - {response.text}")
                return False
            
        except Exception as e:
            logger.exception(f"Error asignando rol 'estudiante postulante': {str(e)}")
            return False
    
    def assign_role_to_user(self, keycloak_user_id: str, role_name: str) -> bool:
        """
        Asigna un rol específico a un usuario en Keycloak
        
        Args:
            keycloak_user_id: ID del usuario en Keycloak
            role_name: Nombre del rol ('estudiante postulante', 'estudiante becado', etc.)
        
        Returns:
            bool: True si se asignó correctamente
        """
        try:
            # Obtener token de admin
            admin_token = self._get_admin_token()
            if not admin_token:
                logger.error("No se pudo obtener token de admin para asignar rol")
                return False
            
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            # Obtener UUID del cliente dubss-backend
            roles_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients"
            response = requests.get(f"{roles_url}?clientId={self.client_id}", headers=headers)
            clients = response.json()
            
            if not clients:
                logger.error(f"Cliente {self.client_id} no encontrado")
                return False
            
            client_uuid = clients[0]['id']
            
            # URL encode del nombre del rol (espacios → %20)
            from urllib.parse import quote
            role_name_encoded = quote(role_name)
            
            # Obtener el rol específico
            role_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients/{client_uuid}/roles/{role_name_encoded}"
            response = requests.get(role_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Rol '{role_name}' no encontrado en Keycloak: {response.status_code}")
                return False
            
            role_data = response.json()
            
            # Asignar rol al usuario
            assign_url = f"{self.keycloak_url}/admin/realms/{self.realm}/users/{keycloak_user_id}/role-mappings/clients/{client_uuid}"
            response = requests.post(
                assign_url,
                json=[role_data],
                headers={'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
            )
            
            if response.status_code == 204:
                logger.info(f"Rol {role_name} asignado correctamente al usuario {keycloak_user_id}")
                return True
            else:
                logger.error(f"Error asignando rol: {response.status_code} - {response.text}")
                return False
            
        except Exception as e:
            logger.exception(f"Error asignando rol {role_name} al usuario: {str(e)}")
            return False
    
    def remove_role_from_user(self, keycloak_user_id: str, role_name: str) -> bool:
        """
        Quita un rol específico de un usuario en Keycloak
        
        Args:
            keycloak_user_id: ID del usuario en Keycloak
            role_name: Nombre del rol a quitar
        
        Returns:
            bool: True si se quitó correctamente
        """
        try:
            # Obtener token de admin
            admin_token = self._get_admin_token()
            if not admin_token:
                logger.error("No se pudo obtener token de admin para quitar rol")
                return False
            
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            # Obtener UUID del cliente dubss-backend
            roles_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients"
            response = requests.get(f"{roles_url}?clientId={self.client_id}", headers=headers)
            clients = response.json()
            
            if not clients:
                logger.error(f"Cliente {self.client_id} no encontrado")
                return False
            
            client_uuid = clients[0]['id']
            
            # URL encode del nombre del rol (espacios → %20)
            from urllib.parse import quote
            role_name_encoded = quote(role_name)
            
            # Obtener el rol específico
            role_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients/{client_uuid}/roles/{role_name_encoded}"
            response = requests.get(role_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Rol '{role_name}' no encontrado en Keycloak: {response.status_code}")
                return False
            
            role_data = response.json()
            
            # Quitar rol del usuario (DELETE en lugar de POST)
            remove_url = f"{self.keycloak_url}/admin/realms/{self.realm}/users/{keycloak_user_id}/role-mappings/clients/{client_uuid}"
            response = requests.delete(
                remove_url,
                json=[role_data],
                headers={'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
            )
            
            if response.status_code == 204:
                logger.info(f"Rol {role_name} quitado correctamente del usuario {keycloak_user_id}")
                return True
            else:
                logger.error(f"Error quitando rol: {response.status_code} - {response.text}")
                return False
            
        except Exception as e:
            logger.exception(f"Error quitando rol {role_name} del usuario: {str(e)}")
            return False
    
    def get_user_roles(self, keycloak_user_id: str) -> list:
        """
        Obtiene todos los roles de un usuario en Keycloak
        
        Args:
            keycloak_user_id: ID del usuario en Keycloak
        
        Returns:
            list: Lista de nombres de roles del usuario
        """
        try:
            # Obtener token de admin
            admin_token = self._get_admin_token()
            if not admin_token:
                logger.error("No se pudo obtener token de admin para obtener roles")
                return []
            
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            # Obtener UUID del cliente dubss-backend
            roles_url = f"{self.keycloak_url}/admin/realms/{self.realm}/clients"
            response = requests.get(f"{roles_url}?clientId={self.client_id}", headers=headers)
            clients = response.json()
            
            if not clients:
                logger.error(f"Cliente {self.client_id} no encontrado")
                return []
            
            client_uuid = clients[0]['id']
            
            # Obtener roles del usuario
            user_roles_url = f"{self.keycloak_url}/admin/realms/{self.realm}/users/{keycloak_user_id}/role-mappings/clients/{client_uuid}"
            response = requests.get(user_roles_url, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"Error obteniendo roles del usuario: {response.status_code}")
                return []
            
            roles_data = response.json()
            
            # Mapear nombres de Keycloak a nombres de Django
            role_mapping_reverse = {
                'director': 'DIRECTOR',
                'analista': 'ANALISTA',
                'responsable': 'RESPONSABLE',
                'estudiante_postulante': 'ESTUDIANTE_POSTULANTE',
                'estudiante_becado': 'ESTUDIANTE_BECADO'
            }
            
            user_roles = []
            for role in roles_data:
                role_name = role.get('name')
                django_role = role_mapping_reverse.get(role_name)
                if django_role:
                    user_roles.append(django_role)
            
            return user_roles
            
        except Exception as e:
            logger.exception(f"Error obteniendo roles del usuario: {str(e)}")
            return []
    
    def _create_django_user(
        self,
        keycloak_id: str,
        email: str,
        student_data: Dict,
        registro_universitario: str
    ) -> Optional[Usuario]:
        """Crea usuario en Django con perfil de estudiante"""
        try:
            # Crear usuario
            usuario = Usuario.objects.create_user(
                correo=email,
                nombre=student_data['nombre'].title(),
                keycloak_user_id=keycloak_id,
                rol=Usuario.RolChoices.ESTUDIANTE_POSTULANTE,
                telefono=student_data.get('tel_celular'),
                is_active=True
            )
            
            # Crear perfil de estudiante
            PerfilEstudiante.objects.create(
                usuario=usuario,
                registro_universitario=registro_universitario,
                ci=student_data.get('ci'),
                facultad=student_data['facultad'],
                carrera=student_data['des_carrera'],
                validado_institucionalmente=True,
                fecha_validacion=timezone.now()
            )
            
            return usuario
            
        except Exception as e:
            logger.exception(f"Error creando usuario en Django: {str(e)}")
            return None
    
    def _delete_keycloak_user(self, user_id: str) -> bool:
        """Elimina usuario de Keycloak (rollback)"""
        try:
            admin_token = self._get_admin_token()
            if not admin_token:
                return False
            
            delete_url = f"{self.keycloak_url}/admin/realms/{self.realm}/users/{user_id}"
            headers = {'Authorization': f'Bearer {admin_token}'}
            
            response = requests.delete(delete_url, headers=headers, timeout=10)
            return response.status_code == 204
            
        except Exception as e:
            logger.error(f"Error eliminando usuario de Keycloak: {str(e)}")
            return False
