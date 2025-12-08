"""
Modelo de Usuario personalizado para DUBSS
"""
import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario"""
    
    def create_user(self, correo, nombre, **extra_fields):
        if not correo:
            raise ValueError('El correo es obligatorio')
        
        correo = self.normalize_email(correo)
        user = self.model(correo=correo, nombre=nombre, **extra_fields)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, correo, nombre, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        return self.create_user(correo, nombre, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """
    Modelo de Usuario base del sistema
    Representa a todos los actores del sistema
    """
    class RolChoices(models.TextChoices):
        DIRECTOR = 'DIRECTOR', 'Director DUBSS'
        ANALISTA = 'ANALISTA', 'Analista de Becas'
        RESPONSABLE = 'RESPONSABLE', 'Responsable de Seguimiento'
        ESTUDIANTE_POSTULANTE = 'ESTUDIANTE_POSTULANTE', 'Estudiante Postulante'
        ESTUDIANTE_BECADO = 'ESTUDIANTE_BECADO', 'Estudiante Becado'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200)
    correo = models.EmailField(unique=True, db_index=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    rol = models.CharField(max_length=25, choices=RolChoices.choices)
    
    # Campos de integración con Keycloak
    keycloak_user_id = models.CharField(max_length=100, unique=True, null=True, blank=True, db_index=True)
    
    # Campos de control
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    objects = UsuarioManager()
    
    USERNAME_FIELD = 'correo'
    REQUIRED_FIELDS = ['nombre']
    
    class Meta:
        db_table = 'usuario'
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.nombre} ({self.get_rol_display()})"


class PerfilInstitucional(models.Model):
    """
    Perfil para usuarios institucionales (Director, Analista, Responsable)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_institucional')
    unidad = models.CharField(max_length=200)
    cargo = models.CharField(max_length=200)
    
    class Meta:
        db_table = 'perfil_institucional'
        verbose_name = 'Perfil Institucional'
        verbose_name_plural = 'Perfiles Institucionales'
    
    def __str__(self):
        return f"{self.usuario.nombre} - {self.cargo}"


class PerfilEstudiante(models.Model):
    """
    Perfil específico para estudiantes
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_estudiante')
    
    # Datos académicos
    registro_universitario = models.CharField(max_length=20, unique=True, db_index=True)
    ci = models.CharField(max_length=20, blank=True, null=True)
    facultad = models.CharField(max_length=200)
    carrera = models.CharField(max_length=200)
    
    # Datos de sincronización institucional
    validado_institucionalmente = models.BooleanField(default=False)
    fecha_validacion = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'perfil_estudiante'
        verbose_name = 'Perfil Estudiante'
        verbose_name_plural = 'Perfiles Estudiantes'
    
    def __str__(self):
        return f"{self.usuario.nombre} - RU: {self.registro_universitario}"
