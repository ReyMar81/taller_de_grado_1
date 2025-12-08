"""
Serializers para gestión de convocatorias
"""
from rest_framework import serializers
from .models import (
    Convocatoria,
    TipoBeca,
    CupoConvocatoria,
    RequisitoDocumento
)
from users.serializers import UsuarioBasicSerializer


class TipoBecaSerializer(serializers.ModelSerializer):
    """Serializer para tipos de beca"""
    
    class Meta:
        model = TipoBeca
        fields = [
            'id',
            'codigo',
            'nombre',
            'descripcion',
            'monto_mensual',
            'duracion_meses',
            'es_pago_directo',
            'requiere_informe_mensual',
            'requisitos_especificos',
            'activo'
        ]
        read_only_fields = ['id']


class CupoConvocatoriaSerializer(serializers.ModelSerializer):
    """Serializer para cupos de convocatoria"""
    tipo_beca_nombre = serializers.CharField(source='tipo_beca.nombre', read_only=True)
    tipo_beca_detalle = TipoBecaSerializer(source='tipo_beca', read_only=True)
    cantidad = serializers.IntegerField(source='cantidad_cupos')
    cupos_disponibles = serializers.ReadOnlyField()
    
    class Meta:
        model = CupoConvocatoria
        fields = [
            'id',
            'convocatoria',
            'tipo_beca',
            'tipo_beca_nombre',
            'tipo_beca_detalle',
            'facultad',
            'cantidad',
            'cupos_disponibles'
        ]
        read_only_fields = ['id']
    
    def validate(self, data):
        """Validar que la facultad corresponda al usuario si es estudiante"""
        if self.instance:
            if data.get('cantidad_cupos', 0) < self.instance.cupos_asignados:
                raise serializers.ValidationError(
                    "No se puede reducir cupos por debajo de los ya asignados"
                )
        return data


class RequisitoDocumentoSerializer(serializers.ModelSerializer):
    """Serializer para requisitos documentales"""
    
    class Meta:
        model = RequisitoDocumento
        fields = [
            'id',
            'convocatoria',
            'nombre',
            'descripcion',
            'tipo_archivo',
            'es_obligatorio',
            'orden'
        ]
        read_only_fields = ['id']


class ConvocatoriaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de convocatorias"""
    creado_por = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    total_cupos = serializers.SerializerMethodField()
    tipos_beca = serializers.SerializerMethodField()
    puede_editar = serializers.BooleanField(read_only=True)
    esta_activa = serializers.BooleanField(read_only=True)
    periodo = serializers.SerializerMethodField()
    
    class Meta:
        model = Convocatoria
        fields = [
            'id',
            'titulo',
            'descripcion',
            'gestion',
            'periodo',
            'fecha_inicio',
            'fecha_cierre',
            'fecha_publicacion_resultados',
            'estado',
            'estado_display',
            'esta_activa',
            'puede_editar',
            'total_cupos',
            'tipos_beca',
            'creado_por',
            'fecha_creacion'
        ]
    
    def get_creado_por(self, obj):
        """Retornar datos básicos del creador"""
        if obj.creado_por:
            return {
                'id': obj.creado_por.id,
                'nombre': obj.creado_por.nombre,
                'correo': obj.creado_por.correo
            }
        return None
    
    def get_total_cupos(self, obj):
        """Calcular total de cupos de la convocatoria"""
        return sum(cupo.cantidad_cupos for cupo in obj.cupos.all())
    
    def get_tipos_beca(self, obj):
        """Retornar lista de nombres de tipos de beca de la convocatoria"""
        return list(obj.cupos.values_list('tipo_beca__nombre', flat=True).distinct())
    
    def get_periodo(self, obj):
        """Extraer periodo de gestion (2025-1 -> 1)"""
        if '-' in obj.gestion:
            return int(obj.gestion.split('-')[1])
        return 1


class ConvocatoriaDetailSerializer(serializers.ModelSerializer):
    """Serializer completo para detalle de convocatoria"""
    creado_por = UsuarioBasicSerializer(read_only=True)
    cupos = CupoConvocatoriaSerializer(many=True, read_only=True)
    requisitos = RequisitoDocumentoSerializer(many=True, read_only=True)
    esta_activa = serializers.BooleanField(read_only=True)
    puede_editar = serializers.BooleanField(read_only=True)
    total_cupos = serializers.SerializerMethodField()
    periodo = serializers.SerializerMethodField()
    
    class Meta:
        model = Convocatoria
        fields = [
            'id',
            'titulo',
            'descripcion',
            'gestion',
            'periodo',
            'fecha_inicio',
            'fecha_cierre',
            'fecha_publicacion_resultados',
            'estado',
            'esta_activa',
            'puede_editar',
            'total_cupos',
            'creado_por',
            'fecha_creacion',
            'fecha_actualizacion',
            'cupos',
            'requisitos'
        ]
    
    def get_total_cupos(self, obj):
        """Total de cupos disponibles"""
        return sum(cupo.cantidad_cupos for cupo in obj.cupos.all())
    
    def get_periodo(self, obj):
        """Extraer periodo de gestion (2025-1 -> 1)"""
        if '-' in obj.gestion:
            return int(obj.gestion.split('-')[1])
        return 1


class ConvocatoriaCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear/actualizar convocatoria"""
    periodo = serializers.IntegerField(write_only=True, required=True)
    
    class Meta:
        model = Convocatoria
        fields = [
            'id',
            'titulo',
            'descripcion',
            'gestion',
            'periodo',
            'fecha_inicio',
            'fecha_cierre',
            'fecha_publicacion_resultados',
            'estado'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        """Combinar gestion y periodo al crear"""
        periodo = validated_data.pop('periodo', 1)
        # Extraer año de gestion si viene como string
        gestion_str = str(validated_data.get('gestion', ''))
        if '-' not in gestion_str:
            validated_data['gestion'] = f"{gestion_str}-{periodo}"
        return super().create(validated_data)
    
    def validate(self, data):
        """Validaciones de fechas"""
        fecha_inicio = data.get('fecha_inicio')
        fecha_cierre = data.get('fecha_cierre')
        fecha_publicacion = data.get('fecha_publicacion_resultados')
        
        if fecha_inicio and fecha_cierre:
            if fecha_cierre <= fecha_inicio:
                raise serializers.ValidationError({
                    'fecha_cierre': 'La fecha de cierre debe ser posterior a la fecha de inicio'
                })
        
        if fecha_publicacion and fecha_cierre:
            if fecha_publicacion <= fecha_cierre:
                raise serializers.ValidationError({
                    'fecha_publicacion_resultados': 'La fecha de publicación debe ser posterior al cierre'
                })
        
        return data
    
    def validate_estado(self, value):
        """Validar transiciones de estado"""
        if self.instance:
            estado_actual = self.instance.estado
            
            # No se puede volver a borrador desde estados avanzados
            if estado_actual != Convocatoria.EstadoChoices.BORRADOR and value == Convocatoria.EstadoChoices.BORRADOR:
                raise serializers.ValidationError(
                    "No se puede cambiar el estado a BORRADOR desde un estado avanzado"
                )
            
            # No se puede publicar una convocatoria finalizada
            if estado_actual == Convocatoria.EstadoChoices.FINALIZADA:
                raise serializers.ValidationError(
                    "No se puede modificar una convocatoria finalizada"
                )
        
        return value


class CambiarEstadoConvocatoriaSerializer(serializers.Serializer):
    """Serializer para cambiar el estado de una convocatoria"""
    estado = serializers.ChoiceField(choices=Convocatoria.EstadoChoices.choices)
    
    def validate_estado(self, value):
        """Validar que el cambio de estado sea válido"""
        convocatoria = self.context.get('convocatoria')
        
        if not convocatoria:
            raise serializers.ValidationError("Convocatoria no encontrada")
        
        estado_actual = convocatoria.estado
        
        # Validar transiciones válidas
        transiciones_validas = {
            Convocatoria.EstadoChoices.BORRADOR: [
                Convocatoria.EstadoChoices.PUBLICADA
            ],
            Convocatoria.EstadoChoices.PUBLICADA: [
                Convocatoria.EstadoChoices.PAUSADA,
                Convocatoria.EstadoChoices.CERRADA
            ],
            Convocatoria.EstadoChoices.PAUSADA: [
                Convocatoria.EstadoChoices.PUBLICADA,
                Convocatoria.EstadoChoices.CERRADA
            ],
            Convocatoria.EstadoChoices.CERRADA: [
                Convocatoria.EstadoChoices.FINALIZADA
            ],
            Convocatoria.EstadoChoices.FINALIZADA: []
        }
        
        if value not in transiciones_validas.get(estado_actual, []):
            raise serializers.ValidationError(
                f"No se puede cambiar de {estado_actual} a {value}"
            )
        
        # Validar que tenga cupos antes de publicar
        if value == Convocatoria.EstadoChoices.PUBLICADA:
            if not convocatoria.cupos.exists():
                raise serializers.ValidationError(
                    "No se puede publicar una convocatoria sin cupos definidos"
                )
            
            if not convocatoria.requisitos.exists():
                raise serializers.ValidationError(
                    "No se puede publicar una convocatoria sin requisitos documentales definidos"
                )
        
        return value
