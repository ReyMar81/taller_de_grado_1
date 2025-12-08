"""
Servicio simulado de MinIO para almacenamiento de archivos
Guarda archivos localmente en backend/media/documentos/
"""
import os
import hashlib
import mimetypes
from datetime import datetime
from pathlib import Path
from django.conf import settings
from django.core.files.storage import FileSystemStorage


class MinIOSimulatedStorage:
    """
    Clase que simula el comportamiento de MinIO
    pero guarda archivos localmente
    """
    
    def __init__(self):
        # Directorio base para almacenar archivos
        self.base_path = os.path.join(settings.MEDIA_ROOT, 'documentos')
        Path(self.base_path).mkdir(parents=True, exist_ok=True)
        
        # Configuración simulada de MinIO
        self.bucket_name = 'dubss-documentos'
        self.endpoint = 'http://localhost:9000'  # Simulado
        
    def upload_file(self, file_obj, folder='general', filename=None):
        """
        Subir un archivo al almacenamiento
        
        Args:
            file_obj: Archivo Django UploadedFile
            folder: Carpeta destino (ej: 'postulaciones', 'convocatorias')
            filename: Nombre personalizado del archivo (opcional)
            
        Returns:
            dict con información del archivo subido
        """
        try:
            # Generar nombre único si no se proporciona
            if filename is None:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                original_name = file_obj.name
                name, ext = os.path.splitext(original_name)
                filename = f"{name}_{timestamp}{ext}"
            
            # Crear carpeta destino
            folder_path = os.path.join(self.base_path, folder)
            Path(folder_path).mkdir(parents=True, exist_ok=True)
            
            # Ruta completa del archivo
            file_path = os.path.join(folder_path, filename)
            
            # Calcular hash SHA256
            file_hash = self._calculate_hash(file_obj)
            
            # Guardar archivo
            with open(file_path, 'wb+') as destination:
                for chunk in file_obj.chunks():
                    destination.write(chunk)
            
            # Obtener información del archivo
            file_size = os.path.getsize(file_path)
            mime_type = mimetypes.guess_type(file_path)[0] or 'application/octet-stream'
            
            # Ruta relativa para URL
            relative_path = os.path.join('documentos', folder, filename)
            
            return {
                'success': True,
                'file_name': filename,
                'original_name': file_obj.name,
                'file_path': relative_path,
                'file_url': f"/media/{relative_path}",
                'file_size': file_size,
                'mime_type': mime_type,
                'hash': file_hash,
                'bucket': self.bucket_name,
                'folder': folder,
                'uploaded_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, file_path):
        """
        Eliminar un archivo del almacenamiento
        
        Args:
            file_path: Ruta relativa del archivo (ej: 'documentos/postulaciones/archivo.pdf')
            
        Returns:
            dict con resultado de la operación
        """
        try:
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            if os.path.exists(full_path):
                os.remove(full_path)
                return {
                    'success': True,
                    'message': 'Archivo eliminado correctamente'
                }
            else:
                return {
                    'success': False,
                    'error': 'Archivo no encontrado'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_file_url(self, file_path, expires=3600):
        """
        Obtener URL de descarga del archivo
        
        Args:
            file_path: Ruta relativa del archivo
            expires: Tiempo de expiración en segundos (simulado)
            
        Returns:
            URL del archivo
        """
        return f"/media/{file_path}"
    
    def file_exists(self, file_path):
        """
        Verificar si un archivo existe
        
        Args:
            file_path: Ruta relativa del archivo
            
        Returns:
            bool
        """
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        return os.path.exists(full_path)
    
    def get_file_info(self, file_path):
        """
        Obtener información de un archivo
        
        Args:
            file_path: Ruta relativa del archivo
            
        Returns:
            dict con información del archivo
        """
        try:
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            if not os.path.exists(full_path):
                return {
                    'success': False,
                    'error': 'Archivo no encontrado'
                }
            
            stat = os.stat(full_path)
            mime_type = mimetypes.guess_type(full_path)[0] or 'application/octet-stream'
            
            return {
                'success': True,
                'file_name': os.path.basename(file_path),
                'file_path': file_path,
                'file_url': f"/media/{file_path}",
                'file_size': stat.st_size,
                'mime_type': mime_type,
                'created_at': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                'modified_at': datetime.fromtimestamp(stat.st_mtime).isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def _calculate_hash(self, file_obj):
        """
        Calcular hash SHA256 del archivo
        
        Args:
            file_obj: Archivo Django UploadedFile
            
        Returns:
            str hash SHA256
        """
        sha256_hash = hashlib.sha256()
        
        # Resetear puntero del archivo
        file_obj.seek(0)
        
        for chunk in file_obj.chunks():
            sha256_hash.update(chunk)
        
        # Resetear puntero nuevamente
        file_obj.seek(0)
        
        return sha256_hash.hexdigest()


# Instancia global del servicio
minio_storage = MinIOSimulatedStorage()
