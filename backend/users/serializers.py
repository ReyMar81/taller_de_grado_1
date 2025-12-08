from rest_framework import serializers
from .models import Usuario, PerfilEstudiante, PerfilInstitucional


class UsuarioBasicSerializer(serializers.ModelSerializer):
    """Serializer básico con información mínima del usuario"""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'nombre', 'correo', 'rol', 'rol_display']
        read_only_fields = ['id']


class PerfilEstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilEstudiante
        fields = ['registro_universitario', 'ci', 'facultad', 'carrera', 'validado_institucionalmente', 'fecha_validacion']


class PerfilInstitucionalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerfilInstitucional
        fields = ['unidad', 'cargo']


class UsuarioSerializer(serializers.ModelSerializer):
    perfil_estudiante = PerfilEstudianteSerializer(read_only=True)
    perfil_institucional = PerfilInstitucionalSerializer(read_only=True)
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    keycloak_roles = serializers.SerializerMethodField()
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'correo', 'telefono', 'rol', 'rol_display',
            'is_active', 'fecha_creacion', 'fecha_actualizacion',
            'perfil_estudiante', 'perfil_institucional', 'keycloak_roles'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']
    
    def get_keycloak_roles(self, obj):
        """Obtiene los roles del usuario desde Keycloak"""
        if not obj.keycloak_user_id:
            return []
        
        try:
            from authentication.services import StudentRegistrationService
            keycloak_service = StudentRegistrationService()
            return keycloak_service.get_user_roles(obj.keycloak_user_id)
        except Exception:
            return []


class UsuarioDetailSerializer(UsuarioSerializer):
    """Serializer con información completa del usuario"""
    
    class Meta(UsuarioSerializer.Meta):
        fields = UsuarioSerializer.Meta.fields + ['keycloak_user_id']
