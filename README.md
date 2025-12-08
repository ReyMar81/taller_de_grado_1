# DUBSS - Sistema de Gestión de Becas con IA y Blockchain

Sistema de gestión de becas universitarias para la UAGRM que integra Inteligencia Artificial para evaluación automatizada y Blockchain para trazabilidad.

## 🏗️ Arquitectura

```
dubss/
├── backend/                 # Django REST Framework
│   ├── dubss/              # Configuración del proyecto
│   ├── users/              # Módulo de usuarios y perfiles
│   ├── authentication/     # Autenticación con Keycloak
│   ├── convocatorias/      # Gestión de convocatorias y becas
│   ├── postulaciones/      # Postulaciones y evaluaciones IA
│   └── manage.py
├── frontend/               # Next.js + TypeScript + Material-UI
│   ├── src/
│   │   ├── app/           # App Router de Next.js
│   │   ├── components/    # Componentes reutilizables
│   │   ├── services/      # Servicios (API, Keycloak)
│   │   └── store/         # Estado global (Zustand)
│   └── public/
├── services/               # Microservicios
│   ├── institutional-api/  # API de datos institucionales
│   ├── ml-service/        # FastAPI + Scikit-learn + SHAP
│   └── blockchain-service/ # Hyperledger Fabric + Go Chaincode
└── docker-compose.yml
```

## 🚀 Tecnologías

### Backend

- Django 5.0
- Django REST Framework
- PostgreSQL 15
- Keycloak 23.0 (OIDC/JWT)
- MinIO (S3 compatible)

### Frontend

- Next.js 14 (App Router)
- TypeScript
- Material-UI v6
- Keycloak-js
- Axios + SWR
- Zustand (estado global)

### Servicios IA/ML

- FastAPI 0.111.0
- Scikit-learn 1.4.2
- SHAP 0.45.1 (Explicabilidad)
- Python 3.11

### Blockchain

- Hyperledger Fabric 2.5.5
- Go 1.21 (Chaincode)
- Docker Compose para red Fabric

### Infraestructura

- Docker 27.0.3 & Docker Compose 2.28.1
- PostgreSQL 16.2
- Keycloak 24.0.3
- MinIO 8.0.10

## 📋 Requisitos Previos

- Docker Desktop instalado
- Git

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repo-url>
cd Taller_grado
```

### 2. Levantar los contenedores

```bash
docker-compose up --build
```

Esto iniciará **todos los servicios del sistema**:

**Infraestructura Base:**

- PostgreSQL en `localhost:5432`
- Keycloak en `http://localhost:8080`
- MinIO en `http://localhost:9000` (consola: `http://localhost:9001`)

**Aplicación Principal:**

- Backend Django en `http://localhost:8000`
- Frontend Next.js en `http://localhost:3000`

**Microservicios:**

- Institutional API en `http://localhost:8001`
- ML Service (Scikit-learn + SHAP) en `http://localhost:8002`

> **Nota**: El ML Service está en modo demostración. El servicio de Blockchain (Hyperledger Fabric) existe como **código de demostración** en `services/blockchain-service/` mostrando la arquitectura completa (chaincode Go, red Docker, etc.) pero no se levanta como contenedor. La funcionalidad de auditoría blockchain está **simulada directamente en el backend Django** para simplificar el despliegue.

### 3. Configurar Keycloak

1. Acceder a Keycloak Admin Console: `http://localhost:8080`

   - Usuario: `admin`
   - Contraseña: `admin`

2. Crear un nuevo Realm llamado `dubss`

3. Crear un cliente `dubss-backend`:

   - Client ID: `dubss-backend`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:8000/*`
   - Copiar el `Client Secret` y actualizarlo en `docker-compose.yml`

4. Crear un cliente `dubss-frontend`:

   - Client ID: `dubss-frontend`
   - Client Protocol: `openid-connect`
   - Access Type: `public`
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`

5. Crear roles en el cliente `dubss-backend`:

   - `director`
   - `analista`
   - `responsable`
   - `estudiante`

6. Crear usuarios de prueba y asignarles roles

### 4. Inicializar la base de datos

```bash
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## 🧪 Pruebas

### Verificar servicios

```bash
# Health check del backend
curl http://localhost:8000/api/auth/health/

# Health check ML Service
curl http://localhost:8002/health

# Health check Institutional API
curl http://localhost:8001/health

# Verificar Keycloak
curl http://localhost:8080/realms/dubss/.well-known/openid-configuration

# Ver todos los contenedores corriendo
docker-compose ps
```

**Deberías ver 7 contenedores corriendo:**

- dubss_postgres
- dubss_keycloak
- dubss_minio
- dubss_backend
- dubss_frontend
- dubss_institutional_api
- dubss_ml_service

### Probar autenticación

1. Acceder a `http://localhost:3000`
2. Clic en "Iniciar Sesión con Keycloak"
3. Ingresar credenciales de un usuario de prueba
4. Verificar que se muestre el dashboard con la información del usuario

## 📝 Estado del Proyecto

### ✅ Fase 1 - RF1: Autenticación + RBAC (COMPLETADO)

- [x] Estructura del proyecto
- [x] Configuración de Docker Compose
- [x] Backend Django con modelos de Usuario
- [x] Integración con Keycloak
- [x] Frontend Next.js con TypeScript
- [x] Sistema de autenticación completo
- [x] Permisos basados en roles (RBAC)

### ✅ Fase 2 - RF2/RF3: Convocatorias (COMPLETADO)

- [x] Modelos: TipoBeca, Convocatoria
- [x] CRUD completo de convocatorias
- [x] Gestión de estados (BORRADOR, PUBLICADA, EN_PROCESO, CERRADA, FINALIZADA)
- [x] Frontend con filtros y gestión completa

### ✅ Fase 3 - RF4/RF5: Postulaciones (COMPLETADO)

- [x] Modelos: Postulacion, DatosSocioeconomicos, DatosAcademicos
- [x] CRUD completo de postulaciones
- [x] Gestión de estados (BORRADOR, RECEPCIONADO, EN_REVISION, etc.)
- [x] Validaciones y reglas de negocio

### ✅ Fase 4 - RF6: Evaluación IA Individual (COMPLETADO)

- [x] Endpoint `evaluar` con simulación realista
- [x] Scoring detallado (70% socio + 30% académico)
- [x] SHAP values para explicabilidad
- [x] Frontend: botón "Evaluar con IA" + dialog de resultados

### ✅ Fase 5 - RF7: Evaluación en Lote + PDF (COMPLETADO)

- [x] Endpoint `evaluar_lote` por convocatoria
- [x] Ranking automático de postulantes
- [x] Generación de PDF con WeasyPrint
- [x] Frontend: "Evaluar Convocatoria" + "Exportar PDF"

### ✅ Servicios de Demostración (COMPLETADO)

- [x] ML Service con Scikit-learn 1.4.2 + SHAP 0.45.1 (contenedor funcional)
- [x] Blockchain Service - Código completo de demostración en `services/blockchain-service/`
  - Chaincode en Go con Fabric Contract API
  - Configuración de red Hyperledger Fabric 2.5.5
  - Scripts de despliegue y documentación completa
  - **No levantado como contenedor** - funcionalidad simulada en backend Django
- [x] Institutional API operacional
- [x] Docker Compose con servicios integrados

### 📋 Próximas Fases

- [ ] Fase 6 - RF8: Evaluación Manual (analista)
- [ ] Fase 7 - RF9/RF10: Consejo y Asignación de Becas
- [ ] Fase 8 - RF11: Panel Estudiante Becado + Seguimiento
- [ ] Fase 9 - RF14: Integración real con Blockchain
- [ ] Fase 10 - Entrenamiento real de modelos ML

## 🔐 Usuarios de Prueba (Configurar en Keycloak)

| Usuario                  | Contraseña | Rol                        |
| ------------------------ | ---------- | -------------------------- |
| director@uagrm.edu.bo    | test123    | Director DUBSS             |
| analista@uagrm.edu.bo    | test123    | Analista de Becas          |
| responsable@uagrm.edu.bo | test123    | Responsable de Seguimiento |
| postulante@uagrm.edu.bo  | test123    | Estudiante Postulante      |
| becado@uagrm.edu.bo      | test123    | Estudiante Becado          |

## 📚 API Endpoints

### Autenticación

- `GET /api/auth/health/` - Health check
- `GET /api/auth/verify/` - Verificar token JWT

### Usuarios

- `GET /api/users/` - Listar usuarios
- `GET /api/users/{id}/` - Detalle de usuario
- `GET /api/users/me/` - Usuario autenticado

## 🛠️ Comandos Útiles

```bash
# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart backend
docker-compose restart frontend

# Detener todo
docker-compose down

# Limpiar todo (incluyendo volúmenes)
docker-compose down -v
```

## 📄 Licencia

Proyecto académico - UAGRM

## 👥 Autores

Taller de Grado - UAGRM 2025
