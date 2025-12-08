"""
Serializers para sincronización institucional
"""
from rest_framework import serializers
from users.models import PerfilEstudiante


class SyncRequestSerializer(serializers.Serializer):
    """Serializer para solicitud de sincronización"""
    registro_universitario = serializers.CharField(
        max_length=20,
        required=True,
        help_text="Registro universitario del estudiante"
    )


class SyncResponseSerializer(serializers.Serializer):
    """Serializer para respuesta de sincronización"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    data = serializers.DictField(required=False, allow_null=True)


class SyncStatusSerializer(serializers.ModelSerializer):
    """Serializer para estado de sincronización"""
    sincronizado = serializers.BooleanField(source='validado_institucionalmente')
    fecha_sincronizacion = serializers.DateTimeField(source='fecha_validacion', allow_null=True)
    
    class Meta:
        model = PerfilEstudiante
        fields = [
            'sincronizado',
            'fecha_sincronizacion',
            'registro_universitario',
            'facultad',
            'carrera'
        ]
