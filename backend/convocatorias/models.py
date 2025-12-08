"""
Modelos para gestión de convocatorias de becas
"""
import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import Usuario


class Convocatoria(models.Model):
    """
    Modelo para convocatorias de becas
    """
    class EstadoChoices(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        PUBLICADA = 'PUBLICADA', 'Publicada'
        PAUSADA = 'PAUSADA', 'Pausada'
        CERRADA = 'CERRADA', 'Cerrada'
        FINALIZADA = 'FINALIZADA', 'Finalizada'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    gestion = models.CharField(max_length=10, help_text="Ej: 2025-1, 2025-2")
    
    # Fechas
    fecha_inicio = models.DateTimeField(help_text="Fecha de inicio de postulaciones")
    fecha_cierre = models.DateTimeField(help_text="Fecha de cierre de postulaciones")
    fecha_publicacion_resultados = models.DateTimeField(null=True, blank=True)
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=EstadoChoices.choices,
        default=EstadoChoices.BORRADOR
    )
    
    # Auditoría
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='convocatorias_creadas'
    )
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'convocatoria'
        verbose_name = 'Convocatoria'
        verbose_name_plural = 'Convocatorias'
        ordering = ['-fecha_creacion']
    
    def __str__(self):
        return f"{self.titulo} - {self.gestion}"
    
    @property
    def esta_activa(self):
        """Verifica si la convocatoria está activa para postulaciones"""
        now = timezone.now()
        return (
            self.estado == self.EstadoChoices.PUBLICADA and
            self.fecha_inicio <= now <= self.fecha_cierre
        )
    
    @property
    def puede_editar(self):
        """Verifica si la convocatoria puede ser editada"""
        return self.estado in [self.EstadoChoices.BORRADOR, self.EstadoChoices.PAUSADA]


class TipoBeca(models.Model):
    """
    Tipos de becas oficiales según Resolución ICU Nº 061-2024
    Catálogo institucional de becas disponibles
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    codigo = models.CharField(
        max_length=20,
        unique=True,
        default='TEMP',
        help_text="Código interno institucional (ej: BECA-ALI, BECA-EST)"
    )
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    monto_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Monto mensual en bolivianos"
    )
    duracion_meses = models.IntegerField(
        validators=[MinValueValidator(1)],
        default=6,
        help_text="Duración en meses (1 semestre = 6 meses)"
    )
    requiere_informe_mensual = models.BooleanField(
        default=True,
        help_text="Indica si el becario debe enviar informes mensuales de actividades"
    )
    es_pago_directo = models.BooleanField(
        default=True,
        help_text="False para Beca Alimentación (comedor), True para pagos monetarios"
    )
    requisitos_especificos = models.TextField(
        blank=True,
        help_text="Requisitos específicos adicionales para este tipo de beca"
    )
    
    # Sistema de evaluación
    tipo_evaluacion = models.CharField(
        max_length=20,
        choices=[
            ('DEPENDENCIA_70_30', 'Becas de Dependencia (70% Socio + 30% Académico)'),
            ('MERITO_100', 'Mérito Académico (100% Académico)'),
        ],
        default='DEPENDENCIA_70_30',
        help_text="Tipo de evaluación según categoría de beca (Reglamento oficial)"
    )
    
    activo = models.BooleanField(default=True)
    
    # Auditoría
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tipo_beca'
        verbose_name = 'Tipo de Beca'
        verbose_name_plural = 'Tipos de Beca'
        ordering = ['codigo']
    
    def __str__(self):
        return f"{self.nombre} - Bs. {self.monto_mensual}/mes"
    
    def get_ponderaciones(self):
        """
        Retorna las ponderaciones de evaluación según tipo de beca
        
        Returns:
            dict: {'socioeconomico': int, 'academico': int}
        """
        if self.tipo_evaluacion == 'DEPENDENCIA_70_30':
            return {'socioeconomico': 70, 'academico': 30}
        elif self.tipo_evaluacion == 'MERITO_100':
            return {'socioeconomico': 0, 'academico': 100}
        return {'socioeconomico': 70, 'academico': 30}  # default


class CupoConvocatoria(models.Model):
    """
    Cupos disponibles por tipo de beca y facultad en una convocatoria
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    convocatoria = models.ForeignKey(
        Convocatoria,
        on_delete=models.CASCADE,
        related_name='cupos'
    )
    tipo_beca = models.ForeignKey(TipoBeca, on_delete=models.PROTECT)
    facultad = models.CharField(max_length=200, help_text="Nombre de la facultad")
    cantidad_cupos = models.IntegerField(validators=[MinValueValidator(1)])
    cupos_asignados = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    class Meta:
        db_table = 'cupo_convocatoria'
        verbose_name = 'Cupo de Convocatoria'
        verbose_name_plural = 'Cupos de Convocatoria'
        unique_together = ['convocatoria', 'tipo_beca', 'facultad']
    
    def __str__(self):
        return f"{self.convocatoria.titulo} - {self.tipo_beca.nombre} - {self.facultad}"
    
    @property
    def cupos_disponibles(self):
        """Cupos disponibles para asignar"""
        return self.cantidad_cupos - self.cupos_asignados


class RequisitoDocumento(models.Model):
    """
    Documentos requeridos para postular a una convocatoria
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    convocatoria = models.ForeignKey(
        Convocatoria,
        on_delete=models.CASCADE,
        related_name='requisitos'
    )
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    tipo_archivo = models.CharField(
        max_length=30,
        default='PDF',
        help_text='Tipo de archivo: PDF, IMAGEN, DOCUMENTO, FORMULARIO, CUALQUIERA'
    )
    es_obligatorio = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'requisito_documento'
        verbose_name = 'Requisito Documental'
        verbose_name_plural = 'Requisitos Documentales'
        ordering = ['convocatoria', 'orden']
    
    def __str__(self):
        obligatorio = "Obligatorio" if self.es_obligatorio else "Opcional"
        return f"{self.nombre} ({obligatorio})"
