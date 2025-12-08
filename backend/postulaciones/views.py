"""
Views para gestión de postulaciones
"""
import requests
import time
import logging
from decimal import Decimal
from django.conf import settings
from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from django.utils import timezone
from weasyprint import HTML
import tempfile

from .models import (
    Postulacion,
    FormularioSocioeconomico,
    FormularioAcademico,
    DocumentoPostulacion,
    EvaluacionIA
)
from .serializers import (
    PostulacionListSerializer,
    PostulacionDetailSerializer,
    PostulacionCreateSerializer,
    FormularioSocioeconomicoSerializer,
    FormularioAcademicoSerializer,
    DocumentoPostulacionSerializer,
    EnviarPostulacionSerializer,
    EvaluacionIASerializer,
    EvaluacionIACreateSerializer
)
from convocatorias.permissions import IsEstudiante, IsDirectorOrAnalista
from minio_service.storage import minio_storage
from authentication.services import StudentRegistrationService

logger = logging.getLogger(__name__)


class PostulacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para postulaciones
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ['convocatoria', 'estado', 'tipo_beca_solicitada', 'estudiante__perfil_estudiante__facultad']
    search_fields = ['estudiante__nombre', 'estudiante__perfil_estudiante__registro_universitario']
    ordering = ['-fecha_creacion']
    
    def get_queryset(self):
        """Filtrar postulaciones según rol"""
        user = self.request.user
        queryset = Postulacion.objects.select_related(
            'convocatoria',
            'estudiante',
            'tipo_beca_solicitada',
            'evaluado_por'
        ).prefetch_related(
            'formulario_socioeconomico',
            'formulario_academico',
            'documentos'
        )
        
        # Estudiantes solo ven sus postulaciones
        if user.rol == 'ESTUDIANTE':
            queryset = queryset.filter(estudiante=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PostulacionCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return PostulacionDetailSerializer
        return PostulacionListSerializer
    
    def perform_create(self, serializer):
        serializer.save(estudiante=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsEstudiante])
    def enviar(self, request, pk=None):
        """Enviar postulación para evaluación"""
        postulacion = self.get_object()
        
        # Verificar que sea el dueño
        if postulacion.estudiante != request.user:
            return Response(
                {'error': 'No tiene permisos para enviar esta postulación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = EnviarPostulacionSerializer(
            data={},
            context={'postulacion': postulacion}
        )
        
        if serializer.is_valid():
            postulacion.estado = Postulacion.EstadoChoices.RECEPCIONADO
            postulacion.fecha_envio = timezone.now()
            postulacion.save()
            
            response_serializer = PostulacionDetailSerializer(postulacion)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], permission_classes=[IsDirectorOrAnalista])
    def evaluar_ia(self, request, pk=None):
        """
        Evalúa una postulación usando IA
        Calcula puntajes según tipo de beca (DEPENDENCIA_70_30 o MERITO_100)
        """
        postulacion = self.get_object()
        
        # Validar estado
        if postulacion.estado != 'RECEPCIONADO':
            return Response({
                'error': f'La postulación debe estar en estado RECEPCIONADO (actual: {postulacion.get_estado_display()})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que tenga formularios completos
        if not hasattr(postulacion, 'formulario_socioeconomico'):
            return Response({
                'error': 'La postulación no tiene formulario socioeconómico completo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not hasattr(postulacion, 'formulario_academico'):
            return Response({
                'error': 'La postulación no tiene formulario académico completo'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar si ya tiene evaluación
        if hasattr(postulacion, 'evaluacion_ia'):
            return Response({
                'error': 'Esta postulación ya tiene una evaluación IA. Elimínela primero si desea reevaluar.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener tipo de beca y ponderaciones
        tipo_beca = postulacion.tipo_beca_solicitada
        ponderaciones = tipo_beca.get_ponderaciones()
        
        # Preparar datos para el microservicio IA
        form_socio = postulacion.formulario_socioeconomico
        form_academico = postulacion.formulario_academico
        
        data_ia = {
            'postulacion_id': str(postulacion.id),
            'tipo_evaluacion': tipo_beca.tipo_evaluacion,
            'ponderaciones': ponderaciones,
            'formulario_socioeconomico': {
                'numero_miembros_familia': form_socio.numero_miembros_familia,
                'numero_dependientes': form_socio.numero_dependientes,
                'ingreso_familiar_mensual': float(form_socio.ingreso_familiar_mensual),
                'ingreso_per_capita': float(form_socio.ingreso_per_capita),
                'gasto_vivienda_mensual': float(form_socio.gasto_vivienda_mensual),
                'gasto_alimentacion_mensual': float(form_socio.gasto_alimentacion_mensual),
                'gasto_educacion_mensual': float(form_socio.gasto_educacion_mensual),
                'gasto_salud_mensual': float(form_socio.gasto_salud_mensual),
                'otros_gastos_mensual': float(form_socio.otros_gastos_mensual),
                'tipo_vivienda': form_socio.tipo_vivienda,
                'tiene_discapacidad': form_socio.tiene_discapacidad,
                'es_madre_soltera': form_socio.es_madre_soltera,
                'es_padre_soltero': form_socio.es_padre_soltero,
                'proviene_area_rural': form_socio.proviene_area_rural
            },
            'formulario_academico': {
                'promedio_general': float(form_academico.promedio_general),
                'semestre_actual': form_academico.semestre_actual,
                'materias_aprobadas': form_academico.materias_aprobadas,
                'materias_reprobadas': form_academico.materias_reprobadas,
                'participa_actividades_universitarias': form_academico.participa_actividades_universitarias,
                'participa_proyectos_investigacion': form_academico.participa_proyectos_investigacion,
                'tiene_reconocimientos_academicos': form_academico.tiene_reconocimientos_academicos
            }
        }
        
        try:
            # Llamar al microservicio IA (simulado por ahora)
            # TODO: Reemplazar con llamada real cuando el microservicio esté disponible
            inicio = time.time()
            
            # URL del microservicio (configurar en settings)
            ia_service_url = getattr(settings, 'IA_SERVICE_URL', None)
            
            if ia_service_url:
                # Llamada real al microservicio
                response = requests.post(
                    f"{ia_service_url}/api/evaluar",
                    json=data_ia,
                    timeout=30
                )
                
                if response.status_code != 200:
                    return Response({
                        'error': f'Error en microservicio IA: {response.text}'
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
                resultado_ia = response.json()
            else:
                # Simulación temporal (cálculo básico)
                resultado_ia = self._simular_evaluacion_ia(data_ia, ponderaciones)
            
            tiempo_procesamiento = int((time.time() - inicio) * 1000)
            
            # Crear evaluación IA
            evaluacion = EvaluacionIA.objects.create(
                postulacion=postulacion,
                puntaje_socioeconomico=Decimal(str(resultado_ia['puntaje_socioeconomico'])),
                puntaje_academico=Decimal(str(resultado_ia['puntaje_academico'])),
                puntaje_total=Decimal(str(resultado_ia['puntaje_total'])),
                ponderacion_socio_aplicada=ponderaciones['socioeconomico'],
                ponderacion_academico_aplicada=ponderaciones['academico'],
                tipo_evaluacion_aplicado=tipo_beca.tipo_evaluacion,
                explicacion_shap=resultado_ia.get('shap_values', {}),
                features_importantes=resultado_ia.get('features_importantes', []),
                recomendacion=resultado_ia['recomendacion'],
                confianza=Decimal(str(resultado_ia.get('confianza', 85.0))),
                modelo_version=resultado_ia.get('modelo_version', 'v1.0-simulado'),
                tiempo_procesamiento_ms=tiempo_procesamiento,
                evaluado_por_usuario=request.user
            )
            
            # Actualizar puntaje en postulación
            postulacion.puntaje_socioeconomico = evaluacion.puntaje_socioeconomico
            postulacion.puntaje_academico = evaluacion.puntaje_academico
            postulacion.puntaje_total = evaluacion.puntaje_total
            postulacion.estado = 'EVALUADO'  # Cambia a EVALUADO automáticamente
            postulacion.save()
            
            serializer = EvaluacionIASerializer(evaluacion)
            return Response({
                'success': True,
                'message': 'Evaluación IA completada exitosamente',
                'evaluacion': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except requests.RequestException as e:
            return Response({
                'error': f'Error de comunicación con microservicio IA: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                'error': f'Error inesperado: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[IsDirectorOrAnalista])
    def evaluar_lote(self, request):
        """
        Evalúa múltiples postulaciones en lote usando IA (por convocatoria)
        Retorna resultados ordenados por puntaje (mayor a menor)
        """
        convocatoria_id = request.data.get('convocatoria_id')
        
        if not convocatoria_id:
            return Response({
                'error': 'Debe especificar una convocatoria'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener postulaciones RECEPCIONADO SIN PUNTAJE (no evaluadas aún)
        postulaciones = Postulacion.objects.filter(
            convocatoria_id=convocatoria_id,
            estado='RECEPCIONADO',
            puntaje_total__isnull=True  # Solo las que NO tienen puntaje
        ).select_related(
            'estudiante',
            'estudiante__perfil_estudiante',
            'tipo_beca_solicitada',
            'convocatoria'
        )
        
        if not postulaciones.exists():
            return Response({
                'error': 'No hay postulaciones pendientes de evaluación (todas ya fueron evaluadas o no hay postulaciones en estado RECEPCIONADO)'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        resultados = []
        errores = []
        convocatoria_info = None
        
        for postulacion in postulaciones:
            try:
                # Guardar info de convocatoria (primera iteración)
                if convocatoria_info is None:
                    convocatoria_info = {
                        'id': str(postulacion.convocatoria.id),
                        'titulo': postulacion.convocatoria.titulo,
                        'gestion': postulacion.convocatoria.gestion
                    }
                
                # Validar formularios
                if not hasattr(postulacion, 'formulario_socioeconomico') or not hasattr(postulacion, 'formulario_academico'):
                    errores.append({
                        'postulacion_id': str(postulacion.id),
                        'estudiante': postulacion.estudiante.nombre,
                        'error': 'Formularios incompletos'
                    })
                    continue
                
                # Verificar si ya tiene evaluación
                if hasattr(postulacion, 'evaluacion_ia'):
                    errores.append({
                        'postulacion_id': str(postulacion.id),
                        'estudiante': postulacion.estudiante.nombre,
                        'error': 'Ya tiene evaluación IA'
                    })
                    continue
                
                # Obtener tipo de beca y ponderaciones
                tipo_beca = postulacion.tipo_beca_solicitada
                ponderaciones = tipo_beca.get_ponderaciones()
                
                # Preparar datos
                form_socio = postulacion.formulario_socioeconomico
                form_academico = postulacion.formulario_academico
                
                data_ia = {
                    'postulacion_id': str(postulacion.id),
                    'tipo_evaluacion': tipo_beca.tipo_evaluacion,
                    'ponderaciones': ponderaciones,
                    'formulario_socioeconomico': {
                        'numero_miembros_familia': form_socio.numero_miembros_familia,
                        'numero_dependientes': form_socio.numero_dependientes,
                        'ingreso_familiar_mensual': float(form_socio.ingreso_familiar_mensual),
                        'ingreso_per_capita': float(form_socio.ingreso_per_capita),
                        'gasto_vivienda_mensual': float(form_socio.gasto_vivienda_mensual),
                        'gasto_alimentacion_mensual': float(form_socio.gasto_alimentacion_mensual),
                        'gasto_educacion_mensual': float(form_socio.gasto_educacion_mensual),
                        'gasto_salud_mensual': float(form_socio.gasto_salud_mensual),
                        'otros_gastos_mensual': float(form_socio.otros_gastos_mensual),
                        'tipo_vivienda': form_socio.tipo_vivienda,
                        'tiene_discapacidad': form_socio.tiene_discapacidad,
                        'es_madre_soltera': form_socio.es_madre_soltera,
                        'es_padre_soltero': form_socio.es_padre_soltero,
                        'proviene_area_rural': form_socio.proviene_area_rural
                    },
                    'formulario_academico': {
                        'promedio_general': float(form_academico.promedio_general),
                        'semestre_actual': form_academico.semestre_actual,
                        'materias_aprobadas': form_academico.materias_aprobadas,
                        'materias_reprobadas': form_academico.materias_reprobadas,
                        'participa_actividades_universitarias': form_academico.participa_actividades_universitarias,
                        'participa_proyectos_investigacion': form_academico.participa_proyectos_investigacion,
                        'tiene_reconocimientos_academicos': form_academico.tiene_reconocimientos_academicos
                    }
                }
                
                # Evaluar (simulado o real)
                ia_service_url = getattr(settings, 'IA_SERVICE_URL', None)
                
                if ia_service_url:
                    response = requests.post(
                        f"{ia_service_url}/api/evaluar",
                        json=data_ia,
                        timeout=30
                    )
                    if response.status_code != 200:
                        raise Exception(f'Error en microservicio: {response.text}')
                    resultado_ia = response.json()
                else:
                    resultado_ia = self._simular_evaluacion_ia(data_ia, ponderaciones)
                
                # Crear evaluación
                evaluacion = EvaluacionIA.objects.create(
                    postulacion=postulacion,
                    puntaje_socioeconomico=Decimal(str(resultado_ia['puntaje_socioeconomico'])),
                    puntaje_academico=Decimal(str(resultado_ia['puntaje_academico'])),
                    puntaje_total=Decimal(str(resultado_ia['puntaje_total'])),
                    ponderacion_socio_aplicada=ponderaciones['socioeconomico'],
                    ponderacion_academico_aplicada=ponderaciones['academico'],
                    tipo_evaluacion_aplicado=tipo_beca.tipo_evaluacion,
                    explicacion_shap=resultado_ia.get('shap_values', {}),
                    features_importantes=resultado_ia.get('features_importantes', []),
                    recomendacion=resultado_ia['recomendacion'],
                    confianza=Decimal(str(resultado_ia.get('confianza', 85.0))),
                    modelo_version=resultado_ia.get('modelo_version', 'v1.0-simulado'),
                    tiempo_procesamiento_ms=0,
                    evaluado_por_usuario=request.user
                )
                
                # Actualizar postulación
                postulacion.puntaje_socioeconomico = evaluacion.puntaje_socioeconomico
                postulacion.puntaje_academico = evaluacion.puntaje_academico
                postulacion.puntaje_total = evaluacion.puntaje_total
                postulacion.estado = 'EVALUADO'  # Cambia a EVALUADO automáticamente
                postulacion.save()
                
                resultados.append({
                    'postulacion_id': str(postulacion.id),
                    'estudiante': postulacion.estudiante.nombre,
                    'registro_universitario': postulacion.estudiante.perfil_estudiante.registro_universitario,
                    'ci': postulacion.estudiante.perfil_estudiante.ci or '-',
                    'carrera': postulacion.estudiante.perfil_estudiante.carrera,
                    'facultad': postulacion.estudiante.perfil_estudiante.facultad,
                    'tipo_beca': tipo_beca.nombre,
                    'puntaje_socioeconomico': float(evaluacion.puntaje_socioeconomico),
                    'puntaje_academico': float(evaluacion.puntaje_academico),
                    'puntaje_total': float(evaluacion.puntaje_total),
                    'recomendacion': evaluacion.recomendacion,
                    'confianza': float(evaluacion.confianza),
                    'features_importantes': evaluacion.features_importantes[:3]  # Top 3 factores
                })
                
            except Exception as e:
                errores.append({
                    'postulacion_id': str(postulacion.id),
                    'estudiante': postulacion.estudiante.nombre if hasattr(postulacion, 'estudiante') else '-',
                    'error': str(e)
                })
        
        # Ordenar resultados por puntaje total (mayor a menor)
        resultados_ordenados = sorted(
            resultados,
            key=lambda x: x['puntaje_total'],
            reverse=True
        )
        
        # Agregar ranking
        for idx, resultado in enumerate(resultados_ordenados, 1):
            resultado['ranking'] = idx
        
        return Response({
            'success': True,
            'convocatoria': convocatoria_info,
            'total_procesadas': postulaciones.count(),
            'evaluadas_exitosamente': len(resultados),
            'errores': len(errores),
            'resultados': resultados_ordenados,
            'detalles_errores': errores,
            'fecha_evaluacion': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsDirectorOrAnalista])
    def exportar_resultados_pdf(self, request):
        """
        Exporta los resultados de evaluación en lote a PDF para el tribunal
        """
        convocatoria_id = request.data.get('convocatoria_id')
        
        if not convocatoria_id:
            return Response({
                'error': 'Debe especificar una convocatoria'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener TODAS las postulaciones EVALUADAS de la convocatoria (con y sin evaluación nueva)
        postulaciones = Postulacion.objects.filter(
            convocatoria_id=convocatoria_id,
            estado='EVALUADO',  # Solo las que están en estado EVALUADO
            puntaje_total__isnull=False  # Que tengan puntaje asignado
        ).select_related(
            'estudiante',
            'estudiante__perfil_estudiante',
            'tipo_beca_solicitada',
            'convocatoria',
            'evaluacion_ia'
        ).order_by('-puntaje_total')  # Ordenar por puntaje descendente
        
        if not postulaciones.exists():
            return Response({
                'error': 'No hay postulaciones evaluadas (estado EVALUADO) para esta convocatoria'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Preparar datos para el template
        convocatoria = postulaciones.first().convocatoria
        
        resultados = []
        for idx, post in enumerate(postulaciones, 1):
            eval_ia = post.evaluacion_ia if hasattr(post, 'evaluacion_ia') else None
            
            resultados.append({
                'ranking': idx,
                'registro': post.estudiante.perfil_estudiante.registro_universitario,
                'estudiante': post.estudiante.nombre,
                'ci': post.estudiante.perfil_estudiante.ci or '-',
                'carrera': post.estudiante.perfil_estudiante.carrera,
                'facultad': post.estudiante.perfil_estudiante.facultad,
                'tipo_beca': post.tipo_beca_solicitada.nombre,
                'puntaje_socio': float(post.puntaje_socioeconomico) if post.puntaje_socioeconomico else 0,
                'puntaje_acad': float(post.puntaje_academico) if post.puntaje_academico else 0,
                'puntaje_total': float(post.puntaje_total) if post.puntaje_total else 0,
                'recomendacion': eval_ia.recomendacion if eval_ia else '-',
                'confianza': float(eval_ia.confianza) if eval_ia else 0,
                'top_factores': eval_ia.features_importantes[:3] if eval_ia else []
            })
        
        context = {
            'convocatoria': {
                'titulo': convocatoria.titulo,
                'gestion': convocatoria.gestion,
            },
            'resultados': resultados,
            'total': len(resultados),
            'fecha_generacion': timezone.now().strftime('%d/%m/%Y %H:%M'),
            'generado_por': request.user.nombre
        }
        
        # Renderizar HTML del template
        html_string = render_to_string('postulaciones/resultados_evaluacion_pdf.html', context)
        
        # Generar PDF con WeasyPrint
        html = HTML(string=html_string)
        pdf_file = html.write_pdf()
        
        # Retornar PDF
        response = HttpResponse(pdf_file, content_type='application/pdf')
        filename = f"Resultados_Evaluacion_{convocatoria.gestion}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
    
    @action(detail=False, methods=['post'], permission_classes=[IsDirectorOrAnalista])
    def asignar_becas(self, request):
        """
        Asigna becas a postulaciones EVALUADAS (cambia estado a APROBADO y agrega rol ESTUDIANTE_BECADO)
        Se usa después de la decisión del Consejo
        """
        postulacion_ids = request.data.get('postulacion_ids', [])
        
        if not postulacion_ids:
            return Response({
                'error': 'Debe especificar al menos una postulación'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que todas las postulaciones estén en estado EVALUADO
        postulaciones = Postulacion.objects.filter(
            id__in=postulacion_ids
        ).select_related('estudiante')
        
        if postulaciones.count() != len(postulacion_ids):
            return Response({
                'error': 'Algunas postulaciones no existen'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar estados
        no_evaluadas = postulaciones.exclude(estado='EVALUADO')
        if no_evaluadas.exists():
            return Response({
                'error': f'Solo se pueden asignar becas a postulaciones en estado EVALUADO. '
                         f'{no_evaluadas.count()} postulaciones no están evaluadas.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        aprobadas = []
        errores = []
        
        # Instanciar servicio de Keycloak para actualizar roles
        keycloak_service = StudentRegistrationService()
        
        for postulacion in postulaciones:
            try:
                # Cambiar estado de postulación
                postulacion.estado = 'APROBADO'
                postulacion.save()
                
                # Agregar rol ESTUDIANTE_BECADO al usuario
                usuario = postulacion.estudiante
                old_rol = usuario.rol
                
                # Actualizar rol en Django
                if usuario.rol == 'ESTUDIANTE_POSTULANTE':
                    usuario.rol = 'ESTUDIANTE_BECADO'
                    usuario.save()
                
                # Sincronizar rol en Keycloak
                if usuario.keycloak_user_id:
                    # Asignar nuevo rol estudiante_becado
                    keycloak_service.assign_role_to_user(
                        usuario.keycloak_user_id,
                        'estudiante_becado'
                    )
                    logger.info(f"Rol estudiante_becado asignado en Keycloak para {usuario.correo}")
                else:
                    logger.warning(f"Usuario {usuario.correo} no tiene keycloak_user_id")
                
                # TODO: Crear registro en SeguimientoBeca cuando se implemente ese modelo
                
                aprobadas.append({
                    'postulacion_id': str(postulacion.id),
                    'estudiante': usuario.nombre,
                    'tipo_beca': postulacion.tipo_beca_solicitada.nombre
                })
                
            except Exception as e:
                logger.exception(f"Error asignando beca a postulación {postulacion.id}: {str(e)}")
                errores.append({
                    'postulacion_id': str(postulacion.id),
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'message': f'{len(aprobadas)} becas asignadas correctamente',
            'aprobadas': aprobadas,
            'errores': errores if errores else None
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'], permission_classes=[IsDirectorOrAnalista])
    def rechazar_postulaciones(self, request):
        """
        Rechaza postulaciones EVALUADAS después de la decisión del Consejo
        """
        postulacion_ids = request.data.get('postulacion_ids', [])
        motivo = request.data.get('motivo', 'Decisión del Consejo')
        
        if not postulacion_ids:
            return Response({
                'error': 'Debe especificar al menos una postulación'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar que todas las postulaciones estén en estado EVALUADO
        postulaciones = Postulacion.objects.filter(
            id__in=postulacion_ids
        ).select_related('estudiante')
        
        if postulaciones.count() != len(postulacion_ids):
            return Response({
                'error': 'Algunas postulaciones no existen'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validar estados
        no_evaluadas = postulaciones.exclude(estado='EVALUADO')
        if no_evaluadas.exists():
            return Response({
                'error': f'Solo se pueden rechazar postulaciones en estado EVALUADO. '
                         f'{no_evaluadas.count()} postulaciones no están evaluadas.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rechazadas = []
        errores = []
        
        for postulacion in postulaciones:
            try:
                # Cambiar estado de postulación
                postulacion.estado = 'RECHAZADO'
                postulacion.save()
                
                rechazadas.append({
                    'postulacion_id': str(postulacion.id),
                    'estudiante': postulacion.estudiante.nombre
                })
                
            except Exception as e:
                errores.append({
                    'postulacion_id': str(postulacion.id),
                    'error': str(e)
                })
        
        return Response({
            'success': True,
            'message': f'{len(rechazadas)} postulaciones rechazadas',
            'rechazadas': rechazadas,
            'errores': errores if errores else None
        }, status=status.HTTP_200_OK)
    
    def _simular_evaluacion_ia(self, data, ponderaciones):
        """
        Simulación temporal de evaluación IA con SHAP mock
        TODO: Reemplazar con llamada real al microservicio ML (FastAPI + Scikit-learn + SHAP)
        
        Endpoint futuro: http://ml-service:8001/evaluar
        """
        form_socio = data['formulario_socioeconomico']
        form_academico = data['formulario_academico']
        
        # ============= EVALUACIÓN SOCIOECONÓMICA =============
        puntaje_socio_raw = 0
        shap_socio = {}
        
        # 1. Ingreso per cápita (peso: 40%)
        ingreso_pc = form_socio['ingreso_per_capita']
        if ingreso_pc < 500:
            puntaje_ingreso = 40
            shap_socio['ingreso_per_capita'] = 0.45
        elif ingreso_pc < 1000:
            puntaje_ingreso = 30
            shap_socio['ingreso_per_capita'] = 0.25
        elif ingreso_pc < 2000:
            puntaje_ingreso = 15
            shap_socio['ingreso_per_capita'] = -0.15
        else:
            puntaje_ingreso = 5
            shap_socio['ingreso_per_capita'] = -0.35
        puntaje_socio_raw += puntaje_ingreso
        
        # 2. Número de dependientes (peso: 20%)
        num_dependientes = form_socio['numero_dependientes']
        if num_dependientes >= 4:
            puntaje_dep = 15
            shap_socio['numero_dependientes'] = 0.20
        elif num_dependientes >= 2:
            puntaje_dep = 10
            shap_socio['numero_dependientes'] = 0.10
        else:
            puntaje_dep = 5
            shap_socio['numero_dependientes'] = 0.05
        puntaje_socio_raw += puntaje_dep
        
        # 3. Situaciones especiales (peso: 15%)
        puntaje_especial = 0
        if form_socio.get('tiene_discapacidad', False):
            puntaje_especial += 5
            shap_socio['tiene_discapacidad'] = 0.15
        if form_socio.get('es_madre_soltera', False) or form_socio.get('es_padre_soltero', False):
            puntaje_especial += 4
            shap_socio['padre_madre_soltera'] = 0.12
        if form_socio.get('proviene_area_rural', False):
            puntaje_especial += 3
            shap_socio['area_rural'] = 0.08
        if form_socio.get('es_trabajador', False):
            puntaje_especial += 3
            shap_socio['trabajador'] = 0.08
        puntaje_socio_raw += min(15, puntaje_especial)
        
        # Normalizar a 70 puntos
        puntaje_socio_raw = min(70, puntaje_socio_raw)
        
        # ============= EVALUACIÓN ACADÉMICA =============
        puntaje_acad_raw = 0
        shap_acad = {}
        
        # 1. Promedio general (peso: 60% del académico = 18 pts)
        promedio = form_academico['promedio_general']
        puntaje_promedio = (promedio / 100) * 18
        puntaje_acad_raw += puntaje_promedio
        shap_acad['promedio_general'] = (promedio - 70) / 100  # Normalizado
        
        # 2. Actividades extracurriculares (peso: 20% = 6 pts)
        puntaje_actividades = 0
        if form_academico.get('participa_actividades_universitarias', False):
            puntaje_actividades += 2
            shap_acad['actividades_universitarias'] = 0.08
        if form_academico.get('participa_proyectos_investigacion', False):
            puntaje_actividades += 3
            shap_acad['proyectos_investigacion'] = 0.12
        if form_academico.get('tiene_reconocimientos_academicos', False):
            puntaje_actividades += 1
            shap_acad['reconocimientos'] = 0.05
        puntaje_acad_raw += min(6, puntaje_actividades)
        
        # 3. Materias aprobadas/reprobadas (peso: 20% = 6 pts)
        materias_cursadas = form_academico.get('materias_cursadas', 0)
        materias_aprobadas = form_academico.get('materias_aprobadas', 0)
        if materias_cursadas > 0:
            tasa_aprobacion = (materias_aprobadas / materias_cursadas) * 100
            if tasa_aprobacion >= 90:
                puntaje_tasa = 6
                shap_acad['tasa_aprobacion'] = 0.15
            elif tasa_aprobacion >= 75:
                puntaje_tasa = 4
                shap_acad['tasa_aprobacion'] = 0.08
            else:
                puntaje_tasa = 2
                shap_acad['tasa_aprobacion'] = -0.05
            puntaje_acad_raw += puntaje_tasa
        
        # Normalizar a 30 puntos
        puntaje_acad_raw = min(30, puntaje_acad_raw)
        
        # ============= APLICAR PONDERACIONES SEGÚN TIPO DE BECA =============
        peso_socio = ponderaciones['socioeconomico'] / 100
        peso_acad = ponderaciones['academico'] / 100
        
        if ponderaciones['academico'] == 100:
            # Beca de Excelencia (100% académico)
            puntaje_socio_final = 0
            puntaje_acad_final = (puntaje_acad_raw / 30) * 100
        else:
            # Beca de Dependencia (70% socio + 30% académico)
            puntaje_socio_final = (puntaje_socio_raw / 70) * ponderaciones['socioeconomico']
            puntaje_acad_final = (puntaje_acad_raw / 30) * ponderaciones['academico']
        
        puntaje_total = puntaje_socio_final + puntaje_acad_final
        
        # ============= DETERMINAR RECOMENDACIÓN =============
        if puntaje_total >= 75:
            recomendacion = 'APROBADO'
            confianza = 90.0 + (puntaje_total - 75) / 2.5
        elif puntaje_total >= 60:
            recomendacion = 'REVISION'
            confianza = 70.0 + (puntaje_total - 60) / 1.5
        else:
            recomendacion = 'RECHAZADO'
            confianza = 60.0 + puntaje_total / 6
        
        # ============= PREPARAR VALORES SHAP COMBINADOS =============
        shap_values = {**shap_socio, **shap_acad}
        
        # Top 5 features más importantes
        all_features = []
        for feature, value in shap_values.items():
            all_features.append({
                'feature': feature,
                'nombre': feature.replace('_', ' ').title(),
                'valor_shap': round(value, 3),
                'impacto': 'Positivo' if value > 0 else 'Negativo' if value < 0 else 'Neutral'
            })
        
        # Ordenar por valor absoluto de SHAP
        all_features.sort(key=lambda x: abs(x['valor_shap']), reverse=True)
        features_importantes = all_features[:5]
        
        return {
            'puntaje_socioeconomico': round(puntaje_socio_final, 2),
            'puntaje_academico': round(puntaje_acad_final, 2),
            'puntaje_total': round(puntaje_total, 2),
            'recomendacion': recomendacion,
            'confianza': round(min(99.5, confianza), 2),
            'shap_values': shap_values,
            'features_importantes': features_importantes,
            'modelo_version': 'v1.0-simulado',
            'metadata': {
                'tipo_evaluacion': 'Dependencia 70-30' if ponderaciones['socioeconomico'] > 0 else 'Excelencia 100% Académico',
                'ponderaciones_aplicadas': ponderaciones,
                'total_features_analizadas': len(shap_values)
            }
        }
    
    @action(detail=True, methods=['post'], permission_classes=[IsEstudiante], parser_classes=[MultiPartParser, FormParser])
    def subir_documento(self, request, pk=None):
        """Subir documento a la postulación"""
        postulacion = self.get_object()
        
        # Verificar que sea el dueño
        if postulacion.estudiante != request.user:
            return Response(
                {'error': 'No tiene permisos para subir documentos a esta postulación'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verificar que esté en estado editable
        if not postulacion.puede_editar:
            return Response(
                {'error': 'No puede subir documentos en el estado actual de la postulación'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        archivo = request.FILES.get('archivo')
        requisito_id = request.data.get('requisito')
        
        if not archivo:
            return Response(
                {'error': 'Debe proporcionar un archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not requisito_id:
            return Response(
                {'error': 'Debe especificar el requisito documental'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Subir archivo a MinIO simulado
            folder = f"postulaciones/{postulacion.id}"
            upload_result = minio_storage.upload_file(archivo, folder=folder)
            
            if not upload_result.get('success'):
                return Response(
                    {'error': upload_result.get('error', 'Error al subir archivo')},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            # Verificar si ya existe un documento para este requisito
            documento_existente = DocumentoPostulacion.objects.filter(
                postulacion=postulacion,
                requisito_id=requisito_id
            ).first()
            
            if documento_existente:
                # Eliminar archivo anterior
                if documento_existente.ruta_archivo:
                    old_path = documento_existente.ruta_archivo.replace('/media/', '')
                    minio_storage.delete_file(old_path)
                
                # Actualizar documento existente
                documento_existente.nombre_archivo = upload_result['file_name']
                documento_existente.ruta_archivo = upload_result['file_url']
                documento_existente.tamano_bytes = upload_result['file_size']
                documento_existente.tipo_mime = upload_result['mime_type']
                documento_existente.hash_sha256 = upload_result['hash']
                documento_existente.version += 1
                documento_existente.estado = 'PENDIENTE'
                documento_existente.subido_por = request.user
                documento_existente.save()
                
                documento = documento_existente
            else:
                # Crear nuevo documento
                documento = DocumentoPostulacion.objects.create(
                    postulacion=postulacion,
                    requisito_id=requisito_id,
                    nombre_archivo=upload_result['file_name'],
                    ruta_archivo=upload_result['file_url'],
                    tamano_bytes=upload_result['file_size'],
                    tipo_mime=upload_result['mime_type'],
                    hash_sha256=upload_result['hash'],
                    subido_por=request.user
                )
            
            serializer = DocumentoPostulacionSerializer(documento)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def documentos_requeridos(self, request, pk=None):
        """Obtener lista de documentos requeridos con estado de carga"""
        postulacion = self.get_object()
        
        # Obtener requisitos de la convocatoria
        requisitos = postulacion.convocatoria.requisitos.all()
        
        # Obtener documentos ya subidos
        documentos_subidos = {
            doc.requisito_id: doc 
            for doc in postulacion.documentos.all()
        }
        
        resultado = []
        for requisito in requisitos:
            documento = documentos_subidos.get(requisito.id)
            resultado.append({
                'requisito': {
                    'id': str(requisito.id),
                    'nombre': requisito.nombre,
                    'descripcion': requisito.descripcion,
                    'tipo_documento_esperado': requisito.tipo_archivo,
                    'es_obligatorio': requisito.es_obligatorio
                },
                'documento': DocumentoPostulacionSerializer(documento).data if documento else None,
                'estado': 'SUBIDO' if documento else 'PENDIENTE'
            })
        
        return Response(resultado)
    
    @action(detail=True, methods=['get'])
    def formulario_socioeconomico(self, request, pk=None):
        """Obtener formulario socioeconómico"""
        postulacion = self.get_object()
        try:
            formulario = postulacion.formulario_socioeconomico
            serializer = FormularioSocioeconomicoSerializer(formulario)
            return Response(serializer.data)
        except FormularioSocioeconomico.DoesNotExist:
            return Response({'detail': 'Formulario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def formulario_academico(self, request, pk=None):
        """Obtener formulario académico"""
        postulacion = self.get_object()
        try:
            formulario = postulacion.formulario_academico
            serializer = FormularioAcademicoSerializer(formulario)
            return Response(serializer.data)
        except FormularioAcademico.DoesNotExist:
            return Response({'detail': 'Formulario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def documentos(self, request, pk=None):
        """Obtener documentos de la postulación"""
        postulacion = self.get_object()
        documentos = postulacion.documentos.all()
        serializer = DocumentoPostulacionSerializer(documentos, many=True)
        return Response(serializer.data)


class FormularioSocioeconomicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para formularios socioeconómicos
    """
    queryset = FormularioSocioeconomico.objects.all()
    serializer_class = FormularioSocioeconomicoSerializer
    permission_classes = [IsAuthenticated, IsEstudiante]
    
    def get_queryset(self):
        """Estudiantes solo ven sus formularios"""
        return FormularioSocioeconomico.objects.filter(
            postulacion__estudiante=self.request.user
        ).select_related('postulacion')


class FormularioAcademicoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para formularios académicos
    """
    queryset = FormularioAcademico.objects.all()
    serializer_class = FormularioAcademicoSerializer
    permission_classes = [IsAuthenticated, IsEstudiante]
    
    def get_queryset(self):
        """Estudiantes solo ven sus formularios"""
        return FormularioAcademico.objects.filter(
            postulacion__estudiante=self.request.user
        ).select_related('postulacion')


class DocumentoPostulacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para documentos de postulación
    """
    queryset = DocumentoPostulacion.objects.all()
    serializer_class = DocumentoPostulacionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['postulacion', 'requisito', 'estado']
    
    def get_queryset(self):
        """Filtrar según rol"""
        user = self.request.user
        queryset = DocumentoPostulacion.objects.select_related(
            'postulacion',
            'requisito',
            'subido_por',
            'revisado_por'
        )
        
        if user.rol == 'ESTUDIANTE':
            queryset = queryset.filter(postulacion__estudiante=user)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(subido_por=self.request.user)
