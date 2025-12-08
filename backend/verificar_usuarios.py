"""
Script para verificar usuarios en Django y Keycloak
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dubss.settings')
django.setup()

from users.models import Usuario
from authentication.services import StudentRegistrationService
import requests

print("\n" + "=" * 80)
print("VERIFICACIÓN DE USUARIOS - DJANGO Y KEYCLOAK")
print("=" * 80)

# Verificar usuarios en Django
print("\n>>> USUARIOS EN DJANGO (PostgreSQL):")
usuarios_django = Usuario.objects.all()
print(f"Total: {usuarios_django.count()}\n")

if usuarios_django.exists():
    for u in usuarios_django:
        print(f"  ID: {u.id}")
        print(f"  Correo: {u.correo}")
        print(f"  Nombre: {u.nombre}")
        print(f"  Rol: {u.rol}")
        print(f"  Activo: {u.is_active}")
        print(f"  Keycloak User ID: {u.keycloak_user_id}")
        print()
else:
    print("  ⚠️  No hay usuarios en Django\n")

# Verificar usuarios en Keycloak
print(">>> USUARIOS EN KEYCLOAK:")
try:
    service = StudentRegistrationService()
    token = service._get_admin_token()
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    response = requests.get(
        'http://keycloak:8080/admin/realms/dubss/users',
        headers=headers
    )
    
    if response.status_code == 200:
        users = response.json()
        print(f"Total: {len(users)}\n")
        
        for u in users:
            print(f"  Username: {u.get('username')}")
            print(f"  Email: {u.get('email')}")
            print(f"  Nombre: {u.get('firstName', '')} {u.get('lastName', '')}")
            print(f"  Keycloak ID: {u.get('id')}")
            print(f"  Habilitado: {u.get('enabled')}")
            print()
    else:
        print(f"  ⚠️  Error al consultar Keycloak: {response.status_code}")
        
except Exception as e:
    print(f"  ⚠️  Error: {str(e)}")

print("=" * 80)
print("\n✓ VERIFICACIÓN COMPLETADA\n")
