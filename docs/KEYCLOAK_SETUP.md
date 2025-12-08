# Guía de Configuración de Keycloak para DUBSS

## 1. Acceder a Keycloak Admin Console

URL: `http://localhost:8080`

- Usuario: `admin`
- Contraseña: `admin`

## 2. Crear Realm

1. Hacer clic en el dropdown de Realm (esquina superior izquierda)
2. Clic en "Create Realm"
3. Realm name: `dubss`
4. Enabled: `ON`
5. Clic en "Create"

## 3. Configurar Cliente Backend

1. En el menú lateral: `Clients` → `Create client`
2. Configuración:

   - Client type: `OpenID Connect`
   - Client ID: `dubss-backend`
   - Clic en "Next"

3. Capability config:

   - Client authentication: `ON`
   - Authorization: `OFF`
   - Authentication flow: Marcar solo `Standard flow` y `Direct access grants`
   - Clic en "Next"

4. Login settings:

   - Valid redirect URIs: `http://localhost:8000/*`
   - Valid post logout redirect URIs: `http://localhost:8000/*`
   - Web origins: `http://localhost:8000`
   - Clic en "Save"

5. Copiar el Client Secret:
   - Ir a la pestaña "Credentials"
   - Copiar el "Client secret"
   - Actualizar en `docker-compose.yml` la variable `KEYCLOAK_CLIENT_SECRET`

## 4. Configurar Cliente Frontend

1. `Clients` → `Create client`
2. Configuración:

   - Client type: `OpenID Connect`
   - Client ID: `dubss-frontend`
   - Clic en "Next"

3. Capability config:

   - Client authentication: `OFF` (público)
   - Authorization: `OFF`
   - Authentication flow: Marcar `Standard flow`
   - Clic en "Next"

4. Login settings:
   - Valid redirect URIs: `http://localhost:3000/*`
   - Valid post logout redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
   - Clic en "Save"

## 5. Crear Roles del Cliente

1. En `Clients`, seleccionar `dubss-backend`
2. Ir a pestaña "Roles"
3. Clic en "Create role" y crear cada uno:
   - `director`
   - `analista`
   - `responsable`
   - `estudiante_postulante`
   - `estudiante_becado`

## 6. Crear Usuarios de Prueba

### Usuario 1: Director

1. `Users` → `Add user`
2. Configuración:

   - Username: `director`
   - Email: `director@uagrm.edu.bo`
   - First name: `Juan`
   - Last name: `Pérez Director`
   - Email verified: `ON`
   - Enabled: `ON`
   - Clic en "Create"

3. Configurar credenciales:

   - Ir a pestaña "Credentials"
   - Clic en "Set password"
   - Password: `test123`
   - Password confirmation: `test123`
   - Temporary: `OFF`
   - Clic en "Save"

4. Asignar rol:
   - Ir a pestaña "Role mapping"
   - Clic en "Assign role"
   - Filtrar por "Filter by clients"
   - Buscar `dubss-backend`
   - Seleccionar rol `director`
   - Clic en "Assign"

### Usuario 2: Analista

Repetir proceso con:

- Username: `analista`
- Email: `analista@uagrm.edu.bo`
- First name: `María`
- Last name: `González Analista`
- Password: `test123`
- Rol: `analista`

### Usuario 3: Responsable

Repetir proceso con:

- Username: `responsable`
- Email: `responsable@uagrm.edu.bo`
- First name: `Carlos`
- Last name: `Rodríguez Responsable`
- Password: `test123`
- Rol: `responsable`

### Usuario 4: Estudiante Postulante

Repetir proceso con:

- Username: `estudiante_postulante`
- Email: `postulante@uagrm.edu.bo`
- First name: `Ana`
- Last name: `Martínez Postulante`
- Password: `test123`
- Rol: `estudiante_postulante`

### Usuario 5: Estudiante Becado

Repetir proceso con:

- Username: `estudiante_becado`
- Email: `becado@uagrm.edu.bo`
- First name: `Pedro`
- Last name: `López Becado`
- Password: `test123`
- Rol: `estudiante_becado`

## 7. Configurar Token Settings (Opcional pero recomendado)

1. En el Realm `dubss`, ir a `Realm settings`
2. Pestaña "Tokens"
3. Configurar:
   - Access Token Lifespan: `5 Minutes` (desarrollo) / `15 Minutes` (producción)
   - SSO Session Idle: `30 Minutes`
   - SSO Session Max: `10 Hours`

## 8. Verificar Configuración

### Test del endpoint de configuración:

```bash
curl http://localhost:8080/realms/dubss/.well-known/openid-configuration
```

Debería devolver la configuración del realm.

## 9. Reiniciar Backend

Después de configurar Keycloak y actualizar el `KEYCLOAK_CLIENT_SECRET`:

```bash
docker-compose restart backend
```

## 10. Probar Autenticación

1. Acceder a `http://localhost:3000`
2. Clic en "Iniciar Sesión con Keycloak"
3. Ingresar credenciales (ej: `director` / `test123`)
4. Verificar redirección al dashboard con información del usuario

## Troubleshooting

### Error: "Invalid redirect_uri"

- Verificar que las URIs en el cliente incluyan `http://localhost:3000/*`

### Error: "Client not found"

- Verificar que el Client ID sea exactamente `dubss-frontend` y `dubss-backend`

### Error: "Invalid client credentials"

- Verificar el Client Secret en `docker-compose.yml`
- Regenerar secret en Keycloak si es necesario

### No aparecen los roles

- Verificar que los roles estén asignados al cliente correcto (`dubss-backend`)
- Verificar que el usuario tenga el rol asignado en "Role mapping"
