"""
Permisos personalizados basados en roles
"""
from rest_framework import permissions
from users.models import Usuario


def _check_keycloak_roles(user, required_roles):
    """
    Helper para verificar roles en Keycloak
    
    Args:
        user: Usuario autenticado
        required_roles: Lista de roles requeridos (nombres Django)
    
    Returns:
        bool: True si el usuario tiene alguno de los roles
    """
    if not (hasattr(user, 'keycloak_user_id') and user.keycloak_user_id):
        return False
    
    try:
        from authentication.services import StudentRegistrationService
        keycloak_service = StudentRegistrationService()
        user_roles = keycloak_service.get_user_roles(user.keycloak_user_id)
        return any(role in user_roles for role in required_roles)
    except Exception:
        return False


class IsDirector(permissions.BasePermission):
    """Permiso solo para Director DUBSS - Superusuario con acceso total"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Verificar rol en Django o Keycloak
        return (request.user.rol == Usuario.RolChoices.DIRECTOR or 
                _check_keycloak_roles(request.user, ['DIRECTOR']))


class IsAnalista(permissions.BasePermission):
    """Permiso solo para Analista de Becas"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Director tiene todos los permisos
        if request.user.rol == Usuario.RolChoices.DIRECTOR or _check_keycloak_roles(request.user, ['DIRECTOR']):
            return True
        
        return (request.user.rol == Usuario.RolChoices.ANALISTA or 
                _check_keycloak_roles(request.user, ['ANALISTA']))


class IsResponsable(permissions.BasePermission):
    """Permiso solo para Responsable de Seguimiento"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Director tiene todos los permisos
        if request.user.rol == Usuario.RolChoices.DIRECTOR or _check_keycloak_roles(request.user, ['DIRECTOR']):
            return True
        
        return (request.user.rol == Usuario.RolChoices.RESPONSABLE or 
                _check_keycloak_roles(request.user, ['RESPONSABLE']))


class IsEstudiantePostulante(permissions.BasePermission):
    """Permiso solo para Estudiantes Postulantes"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Director tiene todos los permisos
        if request.user.rol == Usuario.RolChoices.DIRECTOR or _check_keycloak_roles(request.user, ['DIRECTOR']):
            return True
        
        return (request.user.rol == Usuario.RolChoices.ESTUDIANTE_POSTULANTE or 
                _check_keycloak_roles(request.user, ['ESTUDIANTE_POSTULANTE']))


class IsEstudianteBecado(permissions.BasePermission):
    """Permiso solo para Estudiantes Becados"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Director tiene todos los permisos
        if request.user.rol == Usuario.RolChoices.DIRECTOR or _check_keycloak_roles(request.user, ['DIRECTOR']):
            return True
        
        return (request.user.rol == Usuario.RolChoices.ESTUDIANTE_BECADO or 
                _check_keycloak_roles(request.user, ['ESTUDIANTE_BECADO']))


class IsEstudiante(permissions.BasePermission):
    """Permiso para cualquier tipo de Estudiante (Postulante o Becado)"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        # Director tiene todos los permisos
        if request.user.rol == Usuario.RolChoices.DIRECTOR or _check_keycloak_roles(request.user, ['DIRECTOR']):
            return True
        
        return (request.user.rol in [Usuario.RolChoices.ESTUDIANTE_POSTULANTE, Usuario.RolChoices.ESTUDIANTE_BECADO] or 
                _check_keycloak_roles(request.user, ['ESTUDIANTE_POSTULANTE', 'ESTUDIANTE_BECADO']))


class IsDirectorOrAnalista(permissions.BasePermission):
    """Permiso para Director o Analista"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        return (request.user.rol in [Usuario.RolChoices.DIRECTOR, Usuario.RolChoices.ANALISTA] or 
                _check_keycloak_roles(request.user, ['DIRECTOR', 'ANALISTA']))


class IsAdministrativo(permissions.BasePermission):
    """Permiso para cualquier usuario administrativo (Director, Analista, Responsable)"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        return (request.user.rol in [Usuario.RolChoices.DIRECTOR, Usuario.RolChoices.ANALISTA, Usuario.RolChoices.RESPONSABLE] or 
                _check_keycloak_roles(request.user, ['DIRECTOR', 'ANALISTA', 'RESPONSABLE']))


class IsSuperusuario(permissions.BasePermission):
    """Permiso exclusivo para Director - Acceso total al sistema"""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        
        return (request.user.rol == Usuario.RolChoices.DIRECTOR or 
                _check_keycloak_roles(request.user, ['DIRECTOR']))
    
    def has_object_permission(self, request, view, obj):
        """Director tiene permiso sobre cualquier objeto"""
        if not (request.user and request.user.is_authenticated):
            return False
        
        return (request.user.rol == Usuario.RolChoices.DIRECTOR or 
                _check_keycloak_roles(request.user, ['DIRECTOR']))
