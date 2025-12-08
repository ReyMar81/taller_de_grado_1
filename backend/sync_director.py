"""
Script para sincronizar el usuario Director de Keycloak a Django
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'dubss.settings')
django.setup()

from users.models import Usuario, PerfilInstitucional
from authentication.services import StudentRegistrationService
import requests

print("\n" + "=" * 80)
print("SINCRONIZACIÓN USUARIO DIRECTOR - KEYCLOAK → DJANGO")
print("=" * 80)

# Obtener usuario de Keycloak
service = StudentRegistrationService()
token = service._get_admin_token()

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

response = requests.get(
    'http://keycloak:8080/admin/realms/dubss/users',
    headers=headers,
    params={'username': 'director'}
)

if response.status_code == 200:
    users = response.json()
    if users:
        keycloak_user = users[0]
        
        print(f"\n✓ Usuario encontrado en Keycloak:")
        print(f"  Username: {keycloak_user.get('username')}")
        print(f"  Email: {keycloak_user.get('email')}")
        print(f"  Nombre: {keycloak_user.get('firstName', '')} {keycloak_user.get('lastName', '')}")
        print(f"  Keycloak ID: {keycloak_user.get('id')}")
        
        # Crear usuario en Django
        usuario, created = Usuario.objects.update_or_create(
            correo=keycloak_user.get('email'),
            defaults={
                'nombre': f"{keycloak_user.get('firstName', '')} {keycloak_user.get('lastName', '')}".strip(),
                'rol': 'DIRECTOR',
                'keycloak_user_id': keycloak_user.get('id'),
                'is_active': True
            }
        )
        
        # Crear perfil institucional
        perfil, _ = PerfilInstitucional.objects.get_or_create(
            usuario=usuario,
            defaults={
                'cargo': 'Director',
                'unidad': 'Dirección General'
            }
        )
        
        if created:
            print(f"\n✓ Usuario CREADO en Django:")
        else:
            print(f"\n✓ Usuario ACTUALIZADO en Django:")
            
        print(f"  ID: {usuario.id}")
        print(f"  Correo: {usuario.correo}")
        print(f"  Nombre: {usuario.nombre}")
        print(f"  Rol: {usuario.rol}")
        print(f"  Keycloak User ID: {usuario.keycloak_user_id}")
        print(f"  Activo: {usuario.is_active}")
        
        print("\n" + "=" * 80)
        print("✓ SINCRONIZACIÓN COMPLETADA")
        print("=" * 80)
        print("\nAhora puedes hacer login con:")
        print("  Usuario: director@uagrm.edu.bo")
        print("  Contraseña: [la que configuraste en Keycloak]")
        print()
    else:
        print("\n⚠️  No se encontró el usuario 'director' en Keycloak")
else:
    print(f"\n⚠️  Error al consultar Keycloak: {response.status_code}")
