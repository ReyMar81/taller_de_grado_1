"""
Modelos para gestión de postulaciones a becas
"""
import uuid
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import Usuario
from convocatorias.models import Convocatoria, TipoBeca, RequisitoDocumento


class Postulacion(models.Model):
    """
    Postulación de un estudiante a una convocatoria de beca
    """
    class EstadoChoices(models.TextChoices):
        BORRADOR = 'BORRADOR', 'Borrador'
        RECEPCIONADO = 'RECEPCIONADO', 'Recepcionado'
        EN_REVISION = 'EN_REVISION', 'En Revisión'
        OBSERVADO = 'OBSERVADO', 'Observado'
        EVALUADO = 'EVALUADO', 'Evaluado'
        APROBADO = 'APROBADO', 'Aprobado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    convocatoria = models.ForeignKey(
        Convocatoria,
        on_delete=models.PROTECT,
        related_name='postulaciones'
    )
    estudiante = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='postulaciones'
    )
    tipo_beca_solicitada = models.ForeignKey(
        TipoBeca,
        on_delete=models.PROTECT,
        help_text="Tipo de beca a la que postula"
    )
    
    # Estado
    estado = models.CharField(
        max_length=20,
        choices=EstadoChoices.choices,
        default=EstadoChoices.BORRADOR
    )
    
    # Puntajes
    puntaje_socioeconomico = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(70)],
        help_text="Puntaje socioeconómico (máx. 70 pts)"
    )
    puntaje_academico = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(30)],
        help_text="Puntaje académico (máx. 30 pts)"
    )
    puntaje_total = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Puntaje total (máx. 100 pts)"
    )
    
    # Evaluación
    evaluado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='postulaciones_evaluadas'
    )
    fecha_evaluacion = models.DateTimeField(null=True, blank=True)
    observaciones = models.TextField(blank=True)
    
    # Auditoría
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'postulacion'
        verbose_name = 'Postulación'
        verbose_name_plural = 'Postulaciones'
        ordering = ['-fecha_creacion']
        unique_together = ['convocatoria', 'estudiante']
    
    def __str__(self):
        return f"{self.estudiante.nombre_completo} - {self.convocatoria.titulo}"
    
    @property
    def puede_editar(self):
        """Verifica si la postulación puede ser editada por el estudiante"""
        return self.estado in [self.EstadoChoices.BORRADOR, self.EstadoChoices.OBSERVADO]
    
    @property
    def puede_enviar(self):
        """Verifica si la postulación puede ser enviada"""
        # Verificar que tenga formularios completos y documentos obligatorios
        return (
            self.estado == self.EstadoChoices.BORRADOR and
            hasattr(self, 'formulario_socioeconomico') and
            hasattr(self, 'formulario_academico') and
            self.verificar_documentos_completos()
        )
    
    def verificar_documentos_completos(self):
        """Verifica que todos los documentos obligatorios estén cargados"""
        requisitos_obligatorios = self.convocatoria.requisitos.filter(es_obligatorio=True)
        documentos_cargados = self.documentos.filter(
            requisito__in=requisitos_obligatorios
        ).count()
        return documentos_cargados >= requisitos_obligatorios.count()


class FormularioSocioeconomico(models.Model):
    """
    Formulario socioeconómico del estudiante (70 pts)
    Basado en FICHA SOCIOECONÓMICA - IDH oficial
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    postulacion = models.OneToOneField(
        Postulacion,
        on_delete=models.CASCADE,
        related_name='formulario_socioeconomico'
    )
    
    # Datos familiares
    numero_miembros_familia = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Número total de miembros de la familia"
    )
    numero_dependientes = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Número de personas que dependen económicamente"
    )
    
    # Ingresos
    ingreso_familiar_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Ingreso familiar total mensual en Bs."
    )
    ingreso_per_capita = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Ingreso per cápita (ingreso total / miembros familia)"
    )
    
    # Gastos
    gasto_vivienda_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Gasto mensual en vivienda (alquiler/servicios)"
    )
    gasto_alimentacion_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Gasto mensual en alimentación"
    )
    gasto_educacion_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Gasto mensual en educación"
    )
    gasto_salud_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Gasto mensual en salud"
    )
    otros_gastos_mensual = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Otros gastos mensuales"
    )
    
    # Vivienda
    tipo_vivienda = models.CharField(
        max_length=50,
        choices=[
            ('PROPIA', 'Propia'),
            ('ALQUILADA', 'Alquilada'),
            ('PRESTADA', 'Prestada'),
            ('ANTICRETICO', 'Anticrético'),
        ],
        default='PROPIA'
    )
    
    # Situación especial
    tiene_discapacidad = models.BooleanField(default=False)
    es_madre_soltera = models.BooleanField(default=False)
    es_padre_soltero = models.BooleanField(default=False)
    proviene_area_rural = models.BooleanField(default=False)
    
    # Observaciones
    observaciones_adicionales = models.TextField(
        blank=True,
        help_text="Información adicional relevante sobre situación socioeconómica"
    )
    
    # Auditoría
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'formulario_socioeconomico'
        verbose_name = 'Formulario Socioeconómico'
        verbose_name_plural = 'Formularios Socioeconómicos'
    
    def __str__(self):
        return f"Formulario Socioeconómico - {self.postulacion.estudiante.nombre_completo}"
    
    def save(self, *args, **kwargs):
        # Calcular ingreso per cápita automáticamente
        if self.numero_miembros_familia > 0:
            self.ingreso_per_capita = self.ingreso_familiar_mensual / self.numero_miembros_familia
        super().save(*args, **kwargs)


class FormularioAcademico(models.Model):
    """
    Formulario académico del estudiante (30 pts)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    postulacion = models.OneToOneField(
        Postulacion,
        on_delete=models.CASCADE,
        related_name='formulario_academico'
    )
    
    # Datos académicos
    promedio_general = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Promedio académico general"
    )
    semestre_actual = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Semestre que está cursando actualmente"
    )
    materias_aprobadas = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Total de materias aprobadas"
    )
    materias_reprobadas = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        help_text="Total de materias reprobadas"
    )
    
    # Actividades extracurriculares
    participa_actividades_universitarias = models.BooleanField(
        default=False,
        help_text="Participa en actividades extracurriculares universitarias"
    )
    descripcion_actividades = models.TextField(
        blank=True,
        help_text="Descripción de actividades extracurriculares"
    )
    
    # Investigación
    participa_proyectos_investigacion = models.BooleanField(
        default=False,
        help_text="Participa en proyectos de investigación"
    )
    descripcion_investigacion = models.TextField(
        blank=True,
        help_text="Descripción de proyectos de investigación"
    )
    
    # Reconocimientos
    tiene_reconocimientos_academicos = models.BooleanField(
        default=False,
        help_text="Tiene reconocimientos académicos"
    )
    descripcion_reconocimientos = models.TextField(
        blank=True,
        help_text="Descripción de reconocimientos académicos"
    )
    
    # Auditoría
    fecha_creacion = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'formulario_academico'
        verbose_name = 'Formulario Académico'
        verbose_name_plural = 'Formularios Académicos'
    
    def __str__(self):
        return f"Formulario Académico - {self.postulacion.estudiante.nombre_completo}"


class DocumentoPostulacion(models.Model):
    """
    Documentos adjuntos a una postulación
    """
    class EstadoChoices(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente de Revisión'
        APROBADO = 'APROBADO', 'Aprobado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    postulacion = models.ForeignKey(
        Postulacion,
        on_delete=models.CASCADE,
        related_name='documentos'
    )
    requisito = models.ForeignKey(
        RequisitoDocumento,
        on_delete=models.PROTECT,
        help_text="Requisito documental que cumple"
    )
    
    # Archivo
    nombre_archivo = models.CharField(max_length=255)
    ruta_archivo = models.CharField(
        max_length=500,
        help_text="Ruta en MinIO o sistema de archivos"
    )
    tipo_mime = models.CharField(max_length=100)
    tamano_bytes = models.BigIntegerField(
        validators=[MinValueValidator(0)],
        help_text="Tamaño del archivo en bytes"
    )
    hash_sha256 = models.CharField(
        max_length=64,
        help_text="Hash SHA256 para verificación de integridad"
    )
    
    # Control de versiones
    version = models.IntegerField(default=1)
    documento_anterior = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='versiones_posteriores'
    )
    
    # Estado de validación
    estado = models.CharField(
        max_length=20,
        choices=EstadoChoices.choices,
        default=EstadoChoices.PENDIENTE
    )
    revisado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_revisados'
    )
    fecha_revision = models.DateTimeField(null=True, blank=True)
    observaciones_revision = models.TextField(blank=True)
    
    # Auditoría
    subido_por = models.ForeignKey(
        Usuario,
        on_delete=models.PROTECT,
        related_name='documentos_subidos'
    )
    fecha_subida = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'documento_postulacion'
        verbose_name = 'Documento de Postulación'
        verbose_name_plural = 'Documentos de Postulación'
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return f"{self.nombre_archivo} - {self.postulacion.estudiante.nombre}"


class EvaluacionIA(models.Model):
    """
    Evaluación automática de postulación usando IA
    Almacena puntajes calculados y explicabilidad SHAP
    """
    class RecomendacionChoices(models.TextChoices):
        APROBADO = 'APROBADO', 'Recomendado para Aprobación'
        RECHAZADO = 'RECHAZADO', 'Recomendado para Rechazo'
        REVISION = 'REVISION', 'Requiere Revisión Manual'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    postulacion = models.OneToOneField(
        Postulacion,
        on_delete=models.CASCADE,
        related_name='evaluacion_ia'
    )
    
    # Puntajes calculados
    puntaje_socioeconomico = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Puntaje socioeconómico calculado (0-70 para dependencia, 0 para excelencia)"
    )
    puntaje_academico = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Puntaje académico calculado (0-30 para dependencia, 0-100 para excelencia)"
    )
    puntaje_total = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Puntaje total final (0-100)"
    )
    
    # Ponderaciones aplicadas (registro histórico)
    ponderacion_socio_aplicada = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Ponderación socioeconómica aplicada según tipo de beca"
    )
    ponderacion_academico_aplicada = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Ponderación académica aplicada según tipo de beca"
    )
    tipo_evaluacion_aplicado = models.CharField(
        max_length=20,
        help_text="Tipo de evaluación aplicado (DEPENDENCIA_70_30 o MERITO_100)"
    )
    
    # Explicabilidad SHAP
    explicacion_shap = models.JSONField(
        help_text="Valores SHAP para explicar la decisión del modelo IA"
    )
    features_importantes = models.JSONField(
        null=True,
        blank=True,
        help_text="Top features que influyeron en el puntaje"
    )
    
    # Recomendación
    recomendacion = models.CharField(
        max_length=20,
        choices=RecomendacionChoices.choices,
        help_text="Recomendación automática del sistema IA"
    )
    confianza = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        null=True,
        blank=True,
        help_text="Nivel de confianza de la predicción (0-100%)"
    )
    
    # Metadatos del modelo
    modelo_version = models.CharField(
        max_length=50,
        default='v1.0',
        help_text="Versión del modelo IA utilizado"
    )
    tiempo_procesamiento_ms = models.IntegerField(
        null=True,
        blank=True,
        help_text="Tiempo de procesamiento en milisegundos"
    )
    
    # Auditoría
    fecha_evaluacion = models.DateTimeField(auto_now_add=True)
    evaluado_por_usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluaciones_ia_iniciadas',
        help_text="Usuario que solicitó la evaluación IA"
    )
    
    class Meta:
        db_table = 'evaluacion_ia'
        verbose_name = 'Evaluación IA'
        verbose_name_plural = 'Evaluaciones IA'
        ordering = ['-fecha_evaluacion']
    
    def __str__(self):
        return f"Evaluación IA - {self.postulacion.estudiante.nombre} ({self.puntaje_total} pts)"


class SeguimientoBeca(models.Model):
    """
    Seguimiento de becas aprobadas
    Permite a estudiantes becados subir documentos de seguimiento
    """
    class TipoDocumentoChoices(models.TextChoices):
        INFORME_ACADEMICO = 'INFORME_ACADEMICO', 'Informe Académico'
        CERTIFICADO_NOTAS = 'CERTIFICADO_NOTAS', 'Certificado de Notas'
        COMPROBANTE_PAGO = 'COMPROBANTE_PAGO', 'Comprobante de Pago'
        OTRO = 'OTRO', 'Otro'
    
    class EstadoSeguimientoChoices(models.TextChoices):
        PENDIENTE_REVISION = 'PENDIENTE_REVISION', 'Pendiente de Revisión'
        REVISADO = 'REVISADO', 'Revisado'
        OBSERVADO = 'OBSERVADO', 'Observado'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    postulacion = models.ForeignKey(
        'Postulacion',
        on_delete=models.PROTECT,
        related_name='seguimientos',
        help_text="Postulación aprobada que se está siguiendo"
    )
    tipo_documento = models.CharField(
        max_length=30,
        choices=TipoDocumentoChoices.choices,
        default=TipoDocumentoChoices.INFORME_ACADEMICO
    )
    titulo = models.CharField(max_length=200, help_text="Título del documento de seguimiento")
    descripcion = models.TextField(blank=True, help_text="Descripción o comentarios del estudiante")
    documento = models.FileField(upload_to='seguimientos/%Y/%m/', help_text="Archivo de seguimiento")
    
    # Estado y revisión
    estado = models.CharField(
        max_length=20,
        choices=EstadoSeguimientoChoices.choices,
        default=EstadoSeguimientoChoices.PENDIENTE_REVISION
    )
    observaciones_responsable = models.TextField(blank=True, help_text="Observaciones del responsable")
    revisado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='seguimientos_revisados',
        help_text="Responsable que revisó el seguimiento"
    )
    fecha_revision = models.DateTimeField(null=True, blank=True)
    
    # Fechas
    fecha_subida = models.DateTimeField(default=timezone.now)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'seguimiento_beca'
        verbose_name = 'Seguimiento de Beca'
        verbose_name_plural = 'Seguimientos de Becas'
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return f"Seguimiento - {self.postulacion.estudiante.nombre} - {self.titulo}"

