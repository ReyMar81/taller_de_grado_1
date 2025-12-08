# Roles del Sistema DUBSS

## 📋 Descripción de Roles

El sistema DUBSS cuenta con **5 roles principales** que definen los permisos y funcionalidades de cada usuario:

### 1. **Director DUBSS** (`director`)

- **Descripción**: Máxima autoridad del sistema. Tiene acceso total y control absoluto sobre todos los módulos. Supervisa procesos, aprueba decisiones estratégicas, genera reportes ejecutivos y valida eventos críticos en blockchain.
- **Nivel de acceso**: **SUPERUSUARIO** - Acceso total sin restricciones
- **Funcionalidades principales**:
  - **Gestión de convocatorias**: Crear, editar, aprobar, cerrar
  - **Evaluación de postulaciones**: Revisar, aprobar/rechazar asignaciones
  - **Supervisión de IA**: Acceso a resultados y métricas de evaluación automática
  - **Seguimiento académico**: Visualizar todos los reportes, aprobar suspensiones/renovaciones
  - **Blockchain**: Registrar y validar eventos críticos
  - **Dashboards ejecutivos**: Acceso a todos los reportes y métricas institucionales
  - **Gestión de usuarios**: Asignar roles, administrar permisos
  - **Configuración del sistema**: Ajustes globales, parámetros institucionales

### 2. **Analista de Becas** (`analista`)

- **Descripción**: Funcionario encargado de validar documentos, analizar postulaciones, emitir dictámenes técnicos y preparar informes de evaluación. Interactúa con el módulo de IA.
- **Funcionalidades principales**:
  - Validar documentos de postulaciones
  - Revisar recomendaciones de IA
  - Emitir dictámenes técnicos
  - Gestionar convocatorias
  - Evaluar expedientes
  - Asignar becas según criterios

### 3. **Responsable de Seguimiento Académico** (`responsable`)

- **Descripción**: Usuario encargado de supervisar el rendimiento académico de los becarios, validar informes mensuales, registrar alertas y recomendar suspensiones o renovaciones.
- **Funcionalidades principales**:
  - Seguimiento académico mensual de becarios
  - Validar informes de cumplimiento
  - Registrar alertas y observaciones
  - Recomendar renovaciones o suspensiones
  - Monitorear estado de becas vigentes

### 4. **Estudiante Postulante** (`estudiante_postulante`)

- **Descripción**: Estudiante que está aplicando a una beca. Realiza acciones como enviar formularios, cargar documentos, responder observaciones y consultar estado de postulación.
- **Funcionalidades principales**:
  - Postular a convocatorias activas
  - Llenar formularios de postulación
  - Subir documentos requeridos
  - Ver estado de postulación
  - Responder a observaciones
  - Consultar resultados

### 5. **Estudiante Becado** (`estudiante_becado`)

- **Descripción**: Estudiante beneficiado con una beca vigente. Realiza seguimiento académico, envía reportes mensuales, solicita renovación y recibe notificaciones del cumplimiento del programa.
- **Funcionalidades principales**:
  - Ver información de su beca activa
  - Enviar reportes mensuales de seguimiento
  - Solicitar renovación de beca
  - Consultar historial de cumplimiento
  - Recibir notificaciones de alertas
  - Ver trazabilidad blockchain de su beca

---

## 🔄 Transición de Roles

### Postulante → Becado

Cuando un **Estudiante Postulante** es seleccionado y se le asigna una beca:

1. El sistema cambia su rol de `estudiante_postulante` a `estudiante_becado`
2. Se registra la asignación de beca en blockchain
3. Se activa el módulo de seguimiento académico
4. El usuario obtiene acceso a nuevas funcionalidades (reportes mensuales, renovación)

### Becado → Postulante (Opcional)

Si una beca finaliza (cumplimiento completo, suspensión o no renovación):

1. El rol puede cambiar de `estudiante_becado` a `estudiante_postulante`
2. El estudiante puede volver a postular a nuevas convocatorias
3. Se mantiene el historial de becas anteriores

---

## 🔐 Mapeo con Keycloak

Los roles en Keycloak deben crearse en el cliente `dubss-backend` con los siguientes nombres **exactos**:

| Rol en Keycloak         | Rol en Django              | Código                  | Nivel de Acceso |
| ----------------------- | -------------------------- | ----------------------- | --------------- |
| `director`              | Director DUBSS             | `DIRECTOR`              | SUPERUSUARIO    |
| `analista`              | Analista de Becas          | `ANALISTA`              | Administrativo  |
| `responsable`           | Responsable de Seguimiento | `RESPONSABLE`           | Administrativo  |
| `estudiante_postulante` | Estudiante Postulante      | `ESTUDIANTE_POSTULANTE` | Usuario         |
| `estudiante_becado`     | Estudiante Becado          | `ESTUDIANTE_BECADO`     | Usuario         |

### ⚡ Jerarquía de Permisos

```
Director (SUPERUSUARIO)
    ├── Acceso total a todos los módulos
    ├── Sin restricciones de lectura/escritura
    ├── Puede ejecutar cualquier acción del sistema
    └── Hereda automáticamente todos los permisos inferiores

Administrativos (Analista, Responsable)
    ├── Acceso a módulos específicos según rol
    ├── Permisos de lectura/escritura limitados
    └── Requieren aprobación del Director para acciones críticas

Estudiantes (Postulante, Becado)
    ├── Acceso limitado a sus propios datos
    ├── Solo lectura en la mayoría de módulos
    └── Escritura solo en formularios y reportes propios
```

---

## 🎯 Permisos por Módulo

### Módulo: Gestión de Convocatorias

- ✅ **Director: Acceso total** (crear, editar, aprobar, cerrar, eliminar)
- ✅ Analista: Crear/configurar/editar convocatorias
- 📖 Responsable: Solo lectura
- 📖 Estudiantes: Solo visualizar convocatorias activas

### Módulo: Postulaciones

- ✅ **Director: Acceso total** (ver, evaluar, aprobar, rechazar)
- ✅ Analista: Evaluar, validar documentos, emitir dictámenes
- 📖 Responsable: Solo lectura/consulta
- ✅ Estudiante Postulante: Crear/editar/enviar postulación
- 📖 Estudiante Becado: Solo consultar historial

### Módulo: Evaluación (IA + Manual)

- ✅ **Director: Acceso total** (supervisar IA, revisar evaluaciones, aprobar resultados)
- ✅ Analista: Acceso completo (ejecutar IA, evaluación manual, dictámenes)
- ❌ Responsable: Sin acceso
- ❌ Estudiantes: Sin acceso

### Módulo: Seguimiento Académico

- ✅ **Director: Acceso total** (visualizar reportes, aprobar suspensiones/renovaciones)
- 📖 Analista: Solo lectura/consulta
- ✅ Responsable: Acceso completo (registrar seguimiento, emitir alertas)
- ❌ Estudiante Postulante: Sin acceso
- ✅ Estudiante Becado: Enviar reportes mensuales, ver su seguimiento

### Módulo: Blockchain/Trazabilidad

- ✅ **Director: Acceso total** (registrar, consultar, validar eventos críticos)
- ✅ Analista: Consultar trazabilidad completa
- ✅ Responsable: Consultar trazabilidad completa
- ❌ Estudiante Postulante: Sin acceso
- 📖 Estudiante Becado: Ver trazabilidad solo de su beca

### Módulo: Reportes y Dashboards

- ✅ **Director: Acceso total** (todos los reportes, métricas institucionales, exportaciones)
- ✅ Analista: Reportes de postulaciones, evaluaciones, convocatorias
- ✅ Responsable: Reportes de seguimiento académico, becarios
- ❌ Estudiantes: Sin acceso a reportes institucionales

---

## 📝 Implementación en Django

### Modelo Usuario

```python
class RolChoices(models.TextChoices):
    DIRECTOR = 'DIRECTOR', 'Director DUBSS'
    ANALISTA = 'ANALISTA', 'Analista de Becas'
    RESPONSABLE = 'RESPONSABLE', 'Responsable de Seguimiento'
    ESTUDIANTE_POSTULANTE = 'ESTUDIANTE_POSTULANTE', 'Estudiante Postulante'
    ESTUDIANTE_BECADO = 'ESTUDIANTE_BECADO', 'Estudiante Becado'
```

### Permisos Personalizados

```python
# Permiso exclusivo de superusuario
IsSuperusuario  # Solo Director - Acceso absoluto

# Permisos individuales (incluyen automáticamente al Director)
IsDirector      # Solo Director
IsAnalista      # Analista + Director
IsResponsable   # Responsable + Director
IsEstudiantePostulante  # Postulante + Director
IsEstudianteBecado      # Becado + Director

# Permisos combinados
IsEstudiante           # Postulante O Becado + Director
IsAdministrativo       # Director, Analista O Responsable
IsDirectorOrAnalista   # Director O Analista
```

**Nota importante**: El Director tiene acceso implícito a TODOS los permisos del sistema. Cualquier validación de permisos siempre permite acceso al Director.

---

## 🧪 Usuarios de Prueba

| Email                    | Password | Rol                        |
| ------------------------ | -------- | -------------------------- |
| director@uagrm.edu.bo    | test123  | Director DUBSS             |
| analista@uagrm.edu.bo    | test123  | Analista de Becas          |
| responsable@uagrm.edu.bo | test123  | Responsable de Seguimiento |
| postulante@uagrm.edu.bo  | test123  | Estudiante Postulante      |
| becado@uagrm.edu.bo      | test123  | Estudiante Becado          |
