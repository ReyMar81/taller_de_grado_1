"""
Serializers para gestión de postulaciones
"""
from rest_framework import serializers
from .models import (
    Postulacion,
    FormularioSocioeconomico,
    FormularioAcademico,
    DocumentoPostulacion,
    EvaluacionIA,
    SeguimientoBeca
)
from users.serializers import UsuarioBasicSerializer, UsuarioSerializer
from convocatorias.serializers import ConvocatoriaListSerializer, TipoBecaSerializer


class FormularioSocioeconomicoSerializer(serializers.ModelSerializer):
    """Serializer para formulario socioeconómico"""
    
    class Meta:
        model = FormularioSocioeconomico
        fields = [
            'id',
            'postulacion',
            'numero_miembros_familia',
            'numero_dependientes',
            'ingreso_familiar_mensual',
            'ingreso_per_capita',
            'gasto_vivienda_mensual',
            'gasto_alimentacion_mensual',
            'gasto_educacion_mensual',
            'gasto_salud_mensual',
            'otros_gastos_mensual',
            'tipo_vivienda',
            'tiene_discapacidad',
            'es_madre_soltera',
            'es_padre_soltero',
            'proviene_area_rural',
            'observaciones_adicionales',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'ingreso_per_capita', 'fecha_creacion', 'fecha_actualizacion']


class FormularioAcademicoSerializer(serializers.ModelSerializer):
    """Serializer para formulario académico"""
    
    class Meta:
        model = FormularioAcademico
        fields = [
            'id',
            'postulacion',
            'promedio_general',
            'semestre_actual',
            'materias_aprobadas',
            'materias_reprobadas',
            'participa_actividades_universitarias',
            'descripcion_actividades',
            'participa_proyectos_investigacion',
            'descripcion_investigacion',
            'tiene_reconocimientos_academicos',
            'descripcion_reconocimientos',
            'fecha_creacion',
            'fecha_actualizacion'
        ]
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']


class DocumentoPostulacionSerializer(serializers.ModelSerializer):
    """Serializer para documentos de postulación"""
    requisito_nombre = serializers.CharField(source='requisito.nombre', read_only=True)
    subido_por_nombre = serializers.CharField(source='subido_por.nombre', read_only=True)
    revisado_por_nombre = serializers.CharField(source='revisado_por.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    archivo = serializers.CharField(source='ruta_archivo', read_only=True)  # Alias para compatibilidad
    
    class Meta:
        model = DocumentoPostulacion
        fields = [
            'id',
            'postulacion',
            'requisito',
            'requisito_nombre',
            'nombre_archivo',
            'ruta_archivo',
            'archivo',  # Alias
            'tipo_mime',
            'tamano_bytes',
            'hash_sha256',
            'version',
            'documento_anterior',
            'estado',
            'estado_display',
            'revisado_por',
            'revisado_por_nombre',
            'fecha_revision',
            'observaciones_revision',
            'subido_por',
            'subido_por_nombre',
            'fecha_subida'
        ]
        read_only_fields = [
            'id',
            'hash_sha256',
            'version',
            'subido_por',
            'fecha_subida',
            'requisito_nombre',
            'subido_por_nombre',
            'revisado_por_nombre',
            'estado_display',
            'archivo'
        ]


class EvaluacionIASerializer(serializers.ModelSerializer):
    """Serializer para evaluación IA de postulaciones"""
    postulacion_id = serializers.UUIDField(source='postulacion.id', read_only=True)
    estudiante_nombre = serializers.CharField(source='postulacion.estudiante.nombre', read_only=True)
    tipo_beca_nombre = serializers.CharField(source='postulacion.tipo_beca_solicitada.nombre', read_only=True)
    recomendacion_display = serializers.CharField(source='get_recomendacion_display', read_only=True)
    
    class Meta:
        model = EvaluacionIA
        fields = [
            'id',
            'postulacion',
            'postulacion_id',
            'estudiante_nombre',
            'tipo_beca_nombre',
            'puntaje_socioeconomico',
            'puntaje_academico',
            'puntaje_total',
            'ponderacion_socio_aplicada',
            'ponderacion_academico_aplicada',
            'tipo_evaluacion_aplicado',
            'explicacion_shap',
            'features_importantes',
            'recomendacion',
            'recomendacion_display',
            'confianza',
            'modelo_version',
            'tiempo_procesamiento_ms',
            'fecha_evaluacion',
            'evaluado_por_usuario',
            # Nuevos campos de edición
            'editado_manualmente',
            'puntajes_originales_ia',
            'fecha_ultima_edicion',
            'editado_por_usuario'
        ]
        read_only_fields = ['id', 'fecha_evaluacion']


class PostulacionListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de postulaciones"""
    convocatoria_titulo = serializers.CharField(source='convocatoria.titulo', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.nombre', read_only=True)
    estudiante_ru = serializers.CharField(source='estudiante.perfil_estudiante.registro_universitario', read_only=True)
    estudiante_facultad = serializers.CharField(source='estudiante.perfil_estudiante.facultad', read_only=True)
    tipo_beca_nombre = serializers.CharField(source='tipo_beca_solicitada.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)
    tiene_evaluacion_ia = serializers.SerializerMethodField()
    tiene_evaluacion_manual = serializers.SerializerMethodField()
    
    def get_tiene_evaluacion_ia(self, obj):
        return hasattr(obj, 'evaluacion_ia') and obj.evaluacion_ia is not None
    
    def get_tiene_evaluacion_manual(self, obj):
        return obj.evaluado_por is not None
    
    class Meta:
        model = Postulacion
        fields = [
            'id',
            'convocatoria',
            'convocatoria_titulo',
            'estudiante',
            'estudiante_nombre',
            'estudiante_ru',
            'estudiante_facultad',
            'tipo_beca_solicitada',
            'tipo_beca_nombre',
            'estado',
            'estado_display',
            'puntaje_total',
            'puede_editar',
            'fecha_creacion',
            'fecha_envio',
            'tiene_evaluacion_ia',
            'tiene_evaluacion_manual'
        ]


class PostulacionDetailSerializer(serializers.ModelSerializer):
    """Serializer detallado para una postulación"""
    convocatoria = ConvocatoriaListSerializer(read_only=True)
    estudiante = UsuarioSerializer(read_only=True)
    tipo_beca_solicitada_detalle = TipoBecaSerializer(source='tipo_beca_solicitada', read_only=True)
    formulario_socioeconomico = FormularioSocioeconomicoSerializer(read_only=True)
    formulario_academico = FormularioAcademicoSerializer(read_only=True)
    documentos = DocumentoPostulacionSerializer(many=True, read_only=True)
    evaluacion_ia = EvaluacionIASerializer(read_only=True)
    evaluado_por_nombre = serializers.CharField(source='evaluado_por.nombre', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)
    puede_enviar = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Postulacion
        fields = [
            'id',
            'convocatoria',
            'estudiante',
            'tipo_beca_solicitada',
            'tipo_beca_solicitada_detalle',
            'estado',
            'estado_display',
            'puntaje_socioeconomico',
            'puntaje_academico',
            'puntaje_total',
            'evaluacion_ia',
            'evaluado_por',
            'evaluado_por_nombre',
            'fecha_evaluacion',
            'observaciones',
            'fecha_creacion',
            'fecha_actualizacion',
            'fecha_envio',
            'formulario_socioeconomico',
            'formulario_academico',
            'documentos',
            'puede_editar',
            'puede_enviar'
        ]


class PostulacionCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear postulación"""
    
    class Meta:
        model = Postulacion
        fields = [
            'id',
            'convocatoria',
            'tipo_beca_solicitada',
            'estado'
        ]
        read_only_fields = ['id']
    
    def validate(self, data):
        # Verificar que la convocatoria esté activa
        convocatoria = data.get('convocatoria')
        if not convocatoria.esta_activa:
            raise serializers.ValidationError(
                "La convocatoria no está activa para postulaciones"
            )
        
        # Verificar que el estudiante no tenga ya una postulación
        request = self.context.get('request')
        if Postulacion.objects.filter(
            convocatoria=convocatoria,
            estudiante=request.user
        ).exists():
            raise serializers.ValidationError(
                "Ya tiene una postulación registrada para esta convocatoria"
            )
        
        return data
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['estudiante'] = request.user
        return super().create(validated_data)


class EnviarPostulacionSerializer(serializers.Serializer):
    """Serializer para enviar una postulación"""
    
    def validate(self, data):
        postulacion = self.context.get('postulacion')
        
        if not postulacion.puede_enviar:
            errores = []
            
            if not hasattr(postulacion, 'formulario_socioeconomico'):
                errores.append("Debe completar el formulario socioeconómico")
            
            if not hasattr(postulacion, 'formulario_academico'):
                errores.append("Debe completar el formulario académico")
            
            if not postulacion.verificar_documentos_completos():
                errores.append("Debe cargar todos los documentos obligatorios")
            
            raise serializers.ValidationError(errores)
        
        return data


class EvaluacionIACreateSerializer(serializers.Serializer):
    """Serializer para iniciar evaluación IA"""
    postulacion_id = serializers.UUIDField()
    
    def validate_postulacion_id(self, value):
        try:
            postulacion = Postulacion.objects.get(id=value)
        except Postulacion.DoesNotExist:
            raise serializers.ValidationError("Postulación no encontrada")
        
        # Validar estado
        if postulacion.estado != 'RECEPCIONADO':
            raise serializers.ValidationError(
                f"La postulación debe estar en estado RECEPCIONADO (actual: {postulacion.get_estado_display()})"
            )
        
        # Validar que tenga formularios completos
        if not hasattr(postulacion, 'formulario_socioeconomico'):
            raise serializers.ValidationError("La postulación no tiene formulario socioeconómico")
        
        if not hasattr(postulacion, 'formulario_academico'):
            raise serializers.ValidationError("La postulación no tiene formulario académico")
        
        # Validar que no tenga evaluación IA previa
        if hasattr(postulacion, 'evaluacion_ia'):
            raise serializers.ValidationError("Esta postulación ya tiene una evaluación IA")
        
        return value


class SeguimientoBecaSerializer(serializers.ModelSerializer):
    """Serializer para seguimiento de becas"""
    estudiante_nombre = serializers.CharField(source='postulacion.estudiante.nombre', read_only=True)
    estudiante_ru = serializers.CharField(source='postulacion.estudiante.perfil_estudiante.registro_universitario', read_only=True)
    convocatoria_titulo = serializers.CharField(source='postulacion.convocatoria.titulo', read_only=True)
    tipo_beca = serializers.CharField(source='postulacion.tipo_beca_solicitada.nombre', read_only=True)
    revisado_por_nombre = serializers.CharField(source='revisado_por.nombre', read_only=True, allow_null=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    tipo_documento_display = serializers.CharField(source='get_tipo_documento_display', read_only=True)
    
    class Meta:
        model = SeguimientoBeca
        fields = [
            'id',
            'postulacion',
            'tipo_documento',
            'tipo_documento_display',
            'titulo',
            'descripcion',
            'documento',
            'estado',
            'estado_display',
            'observaciones_responsable',
            'revisado_por',
            'revisado_por_nombre',
            'fecha_revision',
            'fecha_subida',
            'fecha_actualizacion',
            # Campos calculados
            'estudiante_nombre',
            'estudiante_ru',
            'convocatoria_titulo',
            'tipo_beca'
        ]
        read_only_fields = ['id', 'fecha_subida', 'fecha_actualizacion', 'revisado_por', 'fecha_revision']
    
    def validate_postulacion(self, value):
        """Validar que la postulación esté aprobada"""
        if value.estado != 'APROBADO':
            raise serializers.ValidationError("Solo se puede crear seguimiento para postulaciones aprobadas")
        return value
