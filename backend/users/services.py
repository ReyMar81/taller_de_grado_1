"""
Servicio de sincronización con el sistema institucional
"""
import requests
import logging
from typing import Dict, Optional, Tuple
from django.conf import settings
from users.models import Usuario, PerfilEstudiante
from django.utils import timezone

logger = logging.getLogger(__name__)


class InstitutionalSyncService:
    """
    Servicio para sincronizar datos de estudiantes con el sistema institucional
    """
    
    def __init__(self):
        self.api_url = getattr(settings, 'INSTITUTIONAL_API_URL', 'http://institutional-api:8001')
        self.timeout = 10  # segundos
    
    def sync_student_data(self, usuario: Usuario, registro_universitario: str) -> Tuple[bool, str, Optional[Dict]]:
        """
        Sincroniza los datos de un estudiante desde el sistema institucional
        
        Args:
            usuario: Instancia del usuario que será sincronizado
            registro_universitario: Registro universitario del estudiante
            
        Returns:
            Tuple[bool, str, Optional[Dict]]: (success, message, data)
                - success: True si la sincronización fue exitosa
                - message: Mensaje descriptivo del resultado
                - data: Datos obtenidos del sistema institucional (si success=True)
        """
        try:
            # Consultar el endpoint institucional
            logger.info(f"Consultando datos institucionales para RU: {registro_universitario}")
            response = requests.get(
                f"{self.api_url}/datos/estudiante/{registro_universitario}",
                timeout=self.timeout
            )
            
            if response.status_code == 404:
                logger.warning(f"Estudiante con RU {registro_universitario} no encontrado en sistema institucional")
                return False, "Registro universitario no encontrado en el sistema institucional", None
            
            response.raise_for_status()
            
            # Parsear respuesta
            data = response.json()
            
            if data.get('type') != 'success':
                logger.error(f"Respuesta de error del sistema institucional: {data}")
                return False, data.get('message', 'Error desconocido del sistema institucional'), None
            
            student_data = data.get('data')
            if not student_data:
                logger.error("Respuesta sin datos del sistema institucional")
                return False, "Respuesta inválida del sistema institucional", None
            
            # Validar datos esenciales
            if not self._validate_student_data(student_data):
                logger.error(f"Datos institucionales incompletos o inválidos: {student_data}")
                return False, "Datos institucionales incompletos o inválidos", None
            
            # Actualizar o crear perfil de estudiante
            success = self._update_student_profile(usuario, registro_universitario, student_data)
            
            if success:
                logger.info(f"Sincronización exitosa para RU: {registro_universitario}")
                return True, "Datos sincronizados correctamente", student_data
            else:
                return False, "Error al actualizar el perfil del estudiante", None
                
        except requests.Timeout:
            logger.error(f"Timeout al consultar sistema institucional para RU: {registro_universitario}")
            return False, "El sistema institucional no responde. Intente más tarde.", None
        
        except requests.RequestException as e:
            logger.error(f"Error de conexión con sistema institucional: {str(e)}")
            return False, "Error de comunicación con el sistema institucional", None
        
        except Exception as e:
            logger.exception(f"Error inesperado en sincronización: {str(e)}")
            return False, f"Error inesperado: {str(e)}", None
    
    def _validate_student_data(self, data: Dict) -> bool:
        """
        Valida que los datos del estudiante contengan los campos esenciales
        
        Args:
            data: Diccionario con los datos del estudiante
            
        Returns:
            bool: True si los datos son válidos
        """
        required_fields = ['nombre', 'ci', 'des_carrera', 'facultad']
        return all(field in data and data[field] for field in required_fields)
    
    def _update_student_profile(
        self, 
        usuario: Usuario, 
        registro_universitario: str, 
        data: Dict
    ) -> bool:
        """
        Actualiza o crea el perfil de estudiante con los datos sincronizados
        
        Args:
            usuario: Usuario a actualizar
            registro_universitario: RU del estudiante
            data: Datos obtenidos del sistema institucional
            
        Returns:
            bool: True si la actualización fue exitosa
        """
        try:
            # Actualizar datos del usuario si es necesario
            nombre_institucional = data['nombre'].title()
            if usuario.nombre != nombre_institucional:
                logger.info(f"Actualizando nombre de usuario: {usuario.nombre} -> {nombre_institucional}")
                usuario.nombre = nombre_institucional
                usuario.save()
            
            # Obtener o crear perfil de estudiante
            perfil, created = PerfilEstudiante.objects.get_or_create(
                usuario=usuario,
                defaults={
                    'registro_universitario': registro_universitario,
                    'facultad': data['facultad'],
                    'carrera': data['des_carrera'],
                    'validado_institucionalmente': True,
                    'fecha_validacion': timezone.now()
                }
            )
            
            # Si ya existía, actualizar datos
            if not created:
                perfil.registro_universitario = registro_universitario
                perfil.facultad = data['facultad']
                perfil.carrera = data['des_carrera']
                perfil.validado_institucionalmente = True
                perfil.fecha_validacion = timezone.now()
                perfil.save()
                logger.info(f"Perfil de estudiante actualizado para RU: {registro_universitario}")
            else:
                logger.info(f"Perfil de estudiante creado para RU: {registro_universitario}")
            
            return True
            
        except Exception as e:
            logger.exception(f"Error al actualizar perfil de estudiante: {str(e)}")
            return False
    
    def get_sync_status(self, usuario: Usuario) -> Dict:
        """
        Obtiene el estado de sincronización de un estudiante
        
        Args:
            usuario: Usuario del que se quiere consultar el estado
            
        Returns:
            Dict: Estado de sincronización
        """
        try:
            perfil = PerfilEstudiante.objects.get(usuario=usuario)
            return {
                'sincronizado': perfil.validado_institucionalmente,
                'fecha_sincronizacion': perfil.fecha_validacion,
                'registro_universitario': perfil.registro_universitario,
                'facultad': perfil.facultad,
                'carrera': perfil.carrera
            }
        except PerfilEstudiante.DoesNotExist:
            return {
                'sincronizado': False,
                'fecha_sincronizacion': None,
                'registro_universitario': None,
                'facultad': None,
                'carrera': None
            }
