import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dubss.settings')
django.setup()

from convocatorias.models import TipoBeca

print("\n" + "=" * 80)
print("TIPOS DE BECA ACTIVOS EN EL SISTEMA")
print("=" * 80)

dependencia = TipoBeca.objects.filter(tipo_evaluacion='DEPENDENCIA_70_30', activo=True).order_by('codigo')
print("\nBECAS DE DEPENDENCIA (70% Socioeconómico + 30% Académico):")
for b in dependencia:
    print(f"  {b.codigo}: {b.nombre} - Bs.{b.monto_mensual}/mes")

merito = TipoBeca.objects.filter(tipo_evaluacion='MERITO_100', activo=True).order_by('codigo')
print("\nBECAS AL MÉRITO ACADÉMICO (100% Académico):")
for b in merito:
    print(f"  {b.codigo}: {b.nombre} - Bs.{b.monto_mensual}/mes")

print(f"\nTotal de becas activas: {TipoBeca.objects.filter(activo=True).count()}")
print("=" * 80)
