"""
Script para crear los 8 tipos de beca oficiales según Resolución ICU Nº 061-2024
Incluye configuración del tipo de evaluación (DEPENDENCIA_70_30 o MERITO_100)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dubss.settings')
django.setup()

from convocatorias.models import TipoBeca

print("=" * 80)
print("ACTUALIZANDO TIPOS DE BECA OFICIALES - Resolución ICU Nº 061-2024")
print("=" * 80)

print("\nActualizando tipos de beca con tipo_evaluacion...\n")

# Datos oficiales de los 8 tipos de beca según Resolución ICU Nº 061-2024
# Categoría A: Becas de Dependencia (evaluación 70% Socioeconómico + 30% Académico)
# Categoría B: Becas al Mérito Académico (evaluación 100% Académico)
tipos_beca_oficiales = [
    # CATEGORÍA A: BECAS DE DEPENDENCIA
    {
        'codigo': 'BECA-ALI',
        'nombre': 'Beca Alimentación',
        'descripcion': 'Desayuno / comedor universitario (no aplica pago directo). Apoyo para estudiantes que requieren alimentación durante su jornada académica.',
        'monto_mensual': 50.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': False,  # Comedor universitario - no es pago directo
        'tipo_evaluacion': 'DEPENDENCIA_70_30',
        'requisitos_especificos': 'Demostrar necesidad económica. Asistir regularmente al comedor universitario.'
    },
    {
        'codigo': 'BECA-ALB',
        'nombre': 'Beca Albergue Universitario',
        'descripcion': 'Proporciona apoyo para estudiantes que viven lejos y necesitan alojamiento. Basada en necesidad económica + rendimiento académico.',
        'monto_mensual': 300.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': False,  # Alojamiento - no es pago directo
        'tipo_evaluacion': 'DEPENDENCIA_70_30',
        'requisitos_especificos': 'Provenir de localidad distante. Demostrar necesidad de alojamiento y situación económica precaria.'
    },
    {
        'codigo': 'BECA-INT',
        'nombre': 'Beca Estudio Internado Rotatorio',
        'descripcion': 'Para estudiantes que ya están en las prácticas finales de sus carreras (rotaciones). Apoya económicamente para transporte y materiales.',
        'monto_mensual': 600.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': True,
        'tipo_evaluacion': 'DEPENDENCIA_70_30',
        'requisitos_especificos': 'Estar cursando internado rotatorio o prácticas profesionales obligatorias. Certificado de la institución donde realiza las prácticas.'
    },
    {
        'codigo': 'BECA-EST',
        'nombre': 'Beca Estudio',
        'descripcion': 'Para colaborar en actividades académicas: tutorías, apoyo administrativo, investigación, etc. El estudiante debe cumplir horas asignadas.',
        'monto_mensual': 500.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': True,
        'tipo_evaluacion': 'DEPENDENCIA_70_30',
        'requisitos_especificos': 'Buen rendimiento académico. Cumplir horas de trabajo asignadas. Presentar informes mensuales de actividades.'
    },
    {
        'codigo': 'BECA-INV',
        'nombre': 'Beca de Investigación',
        'descripcion': 'Para estudiantes que participan en proyectos científicos. Puede ser individual o grupal. Debe entregarse informe final firmado por docente responsable.',
        'monto_mensual': 1000.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': True,
        'tipo_evaluacion': 'DEPENDENCIA_70_30',
        'requisitos_especificos': 'Tener proyecto de investigación aprobado (trabajo dirigido, tesis o proyecto científico). Presentar avances mensuales del proyecto.'
    },
    {
        'codigo': 'BECA-ITE',
        'nombre': 'Beca Interacción',
        'descripcion': 'Para quienes realizan proyectos con la comunidad (servicio social). También puede ser individual o grupal.',
        'monto_mensual': 500.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': True,
        'tipo_evaluacion': 'DEPENDENCIA_70_30',
        'requisitos_especificos': 'Participar en proyecto de interacción social aprobado. Presentar informes mensuales de actividades comunitarias.'
    },
    
    # CATEGORÍA B: BECAS AL MÉRITO ACADÉMICO
    {
        'codigo': 'BECA-EXC-SEM',
        'nombre': 'Beca Excelencia Académica Semestral',
        'descripcion': 'Para estudiantes con mejores notas del semestre anterior. No depende de situación económica, solo mérito académico.',
        'monto_mensual': 750.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': True,
        'tipo_evaluacion': 'MERITO_100',  # 100% Rendimiento Académico
        'requisitos_especificos': 'Promedio semestral superior a 85 puntos. No tener materias reprobadas en el semestre. Mantener rendimiento sobresaliente.'
    },
    {
        'codigo': 'BECA-EXC-ANU',
        'nombre': 'Beca Excelencia Académica Anual',
        'descripcion': 'Similar a la semestral, pero utiliza desempeño de todo el año académico previo.',
        'monto_mensual': 1000.00,
        'duracion_meses': 6,
        'requiere_informe_mensual': True,
        'es_pago_directo': True,
        'tipo_evaluacion': 'MERITO_100',  # 100% Rendimiento Académico
        'requisitos_especificos': 'Promedio anual superior a 90 puntos. No tener materias reprobadas en el año académico. Reconocimiento al mejor desempeño académico.'
    }
]

print("\nActualizando tipos de beca oficiales...\n")

tipos_creados = 0
tipos_actualizados = 0

for data in tipos_beca_oficiales:
    tipo_beca, created = TipoBeca.objects.update_or_create(
        codigo=data['codigo'],
        defaults={
            'nombre': data['nombre'],
            'descripcion': data['descripcion'],
            'monto_mensual': data['monto_mensual'],
            'duracion_meses': data['duracion_meses'],
            'requiere_informe_mensual': data['requiere_informe_mensual'],
            'es_pago_directo': data['es_pago_directo'],
            'tipo_evaluacion': data['tipo_evaluacion'],
            'requisitos_especificos': data['requisitos_especificos'],
            'activo': True
        }
    )
    
    if created:
        tipos_creados += 1
        accion = "CREADO"
    else:
        tipos_actualizados += 1
        accion = "ACTUALIZADO"
    
    # Determinar categoría
    categoria = "A: Becas de Dependencia" if tipo_beca.tipo_evaluacion == 'DEPENDENCIA_70_30' else "B: Becas al Mérito Académico"
    evaluacion = "70% Socio + 30% Académico" if tipo_beca.tipo_evaluacion == 'DEPENDENCIA_70_30' else "100% Académico"
    
    print(f"✓ {accion}: {tipo_beca.nombre} ({tipo_beca.codigo})")
    print(f"  Categoría: {categoria}")
    print(f"  Evaluación: {evaluacion}")
    print(f"  Monto: Bs. {tipo_beca.monto_mensual}/mes")
    print(f"  Duración: {tipo_beca.duracion_meses} meses")
    print(f"  Pago directo: {'Sí' if tipo_beca.es_pago_directo else 'No (servicio in-kind)'}")
    print(f"  Descripción: {tipo_beca.descripcion[:80]}...")
    print()

print("\n" + "=" * 80)
print("RESUMEN")
print("=" * 80)
print(f"Tipos de beca creados: {tipos_creados}")
print(f"Tipos de beca actualizados: {tipos_actualizados}")
print(f"Total de tipos de beca en el sistema: {TipoBeca.objects.filter(activo=True).count()}")
print()

# Resumen por categoría
print("CATEGORÍA A - Becas de Dependencia (Evaluación 70-30):")
dependencia = TipoBeca.objects.filter(tipo_evaluacion='DEPENDENCIA_70_30', activo=True)
for beca in dependencia:
    print(f"  • {beca.nombre} - Bs. {beca.monto_mensual}/mes")

print()
print("CATEGORÍA B - Becas al Mérito Académico (Evaluación 100% Académico):")
merito = TipoBeca.objects.filter(tipo_evaluacion='MERITO_100', activo=True)
for beca in merito:
    print(f"  • {beca.nombre} - Bs. {beca.monto_mensual}/mes")

print("\n" + "=" * 80)
print("✓ TIPOS DE BECA OFICIALES CONFIGURADOS CORRECTAMENTE")
print("=" * 80)
print("\nFuente: Resolución ICU Nº 061-2024")
print("Sistema de evaluación implementado:")
print("  • Becas de Dependencia: 70% Socioeconómico + 30% Académico")
print("  • Becas al Mérito: 100% Académico (sin considerar situación económica)")
print("\nAhora puedes crear convocatorias usando estos tipos de beca oficiales.\n")
