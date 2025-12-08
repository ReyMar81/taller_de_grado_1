"""
Serializers para registro de estudiantes
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from users.models import Usuario


class ValidateStudentSerializer(serializers.Serializer):
    """Serializer para validar RU con el sistema institucional"""
    registro_universitario = serializers.CharField(
        max_length=20,
        required=True,
        help_text="Registro universitario del estudiante"
    )


class StudentDataResponseSerializer(serializers.Serializer):
    """Serializer para respuesta de datos institucionales"""
    nombre = serializers.CharField()
    ci = serializers.CharField()
    lugar_ci = serializers.CharField()
    fecha_nac = serializers.CharField()
    direccion = serializers.CharField()
    telefono = serializers.CharField()
    tel_celular = serializers.CharField()
    sexo = serializers.CharField()
    des_carrera = serializers.CharField()
    facultad = serializers.CharField()
    activo = serializers.CharField()


class RegisterStudentSerializer(serializers.Serializer):
    """Serializer para registro completo de estudiante"""
    registro_universitario = serializers.CharField(
        max_length=20,
        required=True,
        help_text="Registro universitario"
    )
    email = serializers.EmailField(
        required=True,
        help_text="Correo electrónico del estudiante"
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'},
        help_text="Contraseña del usuario"
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text="Confirmación de contraseña"
    )
    
    def validate_email(self, value):
        """Validar que el email no esté registrado"""
        if Usuario.objects.filter(correo=value).exists():
            raise serializers.ValidationError("Este correo ya está registrado")
        return value
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                "confirm_password": "Las contraseñas no coinciden"
            })
        return attrs


class RegisterResponseSerializer(serializers.Serializer):
    """Serializer para respuesta de registro exitoso"""
    success = serializers.BooleanField()
    message = serializers.CharField()
    user_id = serializers.UUIDField(required=False)
    email = serializers.EmailField(required=False)
