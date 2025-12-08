# Flujo de Estados de Postulaciones

## 📋 Estados Actuales vs Flujo Correcto

### Estados Definidos en el Modelo

```python
BORRADOR = 'Borrador'           # Estudiante está llenando formulario
RECEPCIONADO = 'Recepcionado'   # Estudiante envió, esperando evaluación
EN_REVISION = 'En Revisión'     # Analista revisando manualmente
OBSERVADO = 'Observado'         # Tiene observaciones, estudiante debe corregir
EVALUADO = 'Evaluado'           # Ya tiene puntaje (IA o manual)
APROBADO = 'Aprobado'           # Consejo aprobó la beca
RECHAZADO = 'Rechazado'         # Consejo rechazó la postulación
```

---

## 🔄 Flujo Correcto del Proceso

### **Fase 1: Postulación del Estudiante**

1. **BORRADOR** → Estudiante crea postulación

   - Puede editar libremente
   - Puede guardar parcialmente
   - No visible para analistas

2. **Estudiante envía** → Estado cambia a **RECEPCIONADO**
   - Ya no puede editar (o solo en campos específicos)
   - Visible para Director/Analista
   - Esperando evaluación

---

### **Fase 2: Evaluación (IA + Manual Opcional)**

3. **RECEPCIONADO** → Se evalúa con IA

   - Director/Analista hace clic en "Evaluar con IA" (individual)
   - O usa "Evaluar Convocatoria" (lote)
   - Genera puntaje automático
   - Estado cambia a **EVALUADO**

4. **EVALUADO** (tiene puntaje)

   - Si el analista detecta algo sospechoso puede cambiar a **OBSERVADO**
   - Si todo está bien, permanece **EVALUADO**
   - Puede ajustar puntaje manualmente (evaluación manual)

5. **OBSERVADO** (opcional)
   - Analista marca observaciones
   - Estudiante debe corregir documentos/datos
   - Al corregir vuelve a **RECEPCIONADO**

---

### **Fase 3: Generación de Ranking y Tribunal**

6. **EVALUADO** → Generar PDF para Consejo
   - Director genera ranking con **TODAS** las postulaciones en estado **EVALUADO**
   - El PDF incluye:
     - Postulaciones previamente evaluadas (ya tienen puntaje)
     - Postulaciones recién evaluadas en el lote
   - Ranking ordenado por puntaje (mayor a menor)
   - Se imprime/descarga para llevar al Consejo

---

### **Fase 4: Decisión del Consejo (fuera del sistema)**

7. **Reunión del Consejo**
   - Analizan el ranking
   - Deciden quiénes reciben beca según presupuesto
   - Generan lista de APROBADOS y RECHAZADOS

---

### **Fase 5: Carga de Decisiones al Sistema**

8. **EVALUADO** → Director carga decisiones

   - Selecciona postulaciones **APROBADAS** → Estado: **APROBADO**

     - El rol del estudiante cambia a `ESTUDIANTE_BECADO`
     - Se crea registro en `SeguimientoBeca` (si existe el modelo)

   - Selecciona postulaciones **RECHAZADAS** → Estado: **RECHAZADO**
     - El estudiante mantiene rol `ESTUDIANTE`
     - Puede postular en futuras convocatorias

---

## 🎯 Cambios Necesarios

### **1. Evaluación en Lote**

**Problema Actual:**

- Evalúa TODAS las postulaciones en estado RECEPCIONADO

**Solución:**

- Evaluar solo las que NO tienen puntaje (`puntaje_total IS NULL`)
- Cambiar estado a EVALUADO después de evaluar

---

### **2. Generación de Ranking**

**Problema Actual:**

- Solo muestra las recién evaluadas

**Solución:**

- Incluir TODAS las postulaciones en estado EVALUADO
- Ordenar por puntaje descendente
- Indicar cuáles son nuevas vs previamente evaluadas

---

### **3. Asignación de Becas**

**Falta Implementar:**

- Endpoint: `POST /api/postulaciones/asignar_becas/`
- Parámetros:
  ```json
  {
    "postulacion_ids": ["uuid1", "uuid2", ...],
    "convocatoria_id": "uuid"
  }
  ```
- Acciones:
  - Cambiar estado a APROBADO
  - Agregar rol ESTUDIANTE_BECADO al usuario
  - Crear SeguimientoBeca

---

### **4. Rechazo Masivo**

**Falta Implementar:**

- Endpoint: `POST /api/postulaciones/rechazar/`
- Parámetros:
  ```json
  {
    "postulacion_ids": ["uuid1", "uuid2", ...],
    "motivo": "Presupuesto insuficiente"
  }
  ```
- Acciones:
  - Cambiar estado a RECHAZADO
  - Registrar motivo

---

### **5. Frontend - Panel de Decisiones**

**Falta Implementar:**

- Vista después de la reunión del Consejo
- Tabla con ranking de EVALUADOS
- Checkboxes para seleccionar APROBADOS
- Botón "Asignar Becas"
- Checkboxes para seleccionar RECHAZADOS
- Botón "Rechazar Postulaciones"

---

## 📊 Diagrama de Estados

```
BORRADOR
    ↓ (estudiante envía)
RECEPCIONADO
    ↓ (IA evalúa o analista evalúa)
EVALUADO ←──────┐
    ↓           │ (corrige)
OBSERVADO ──────┘
    ↓ (consejo decide)
    ├─→ APROBADO (+ rol ESTUDIANTE_BECADO)
    └─→ RECHAZADO
```

---

## ✅ Plan de Implementación

### **Tarea 1**: Revisar y ajustar estados

- Verificar que los estados actuales son suficientes
- Posible nuevo estado: `PARA_CONSEJO` (opcional, entre EVALUADO y APROBADO/RECHAZADO)

### **Tarea 2**: Modificar evaluación en lote

- Filtrar solo postulaciones sin puntaje
- Cambiar estado a EVALUADO automáticamente

### **Tarea 3**: Ajustar generación de ranking

- Consultar TODAS las EVALUADAS (con y sin puntaje nuevo)
- Ordenar por puntaje
- Marcar visualmente las nuevas en el PDF

### **Tarea 4**: Endpoint asignar_becas

- Cambiar estado a APROBADO
- Agregar rol ESTUDIANTE_BECADO
- Crear SeguimientoBeca

### **Tarea 5**: Endpoint rechazar

- Cambiar estado a RECHAZADO
- Guardar motivo

### **Tarea 6**: Frontend - Panel de decisiones

- Vista separada o sección en Postulaciones
- Filtro por estado EVALUADO
- Selección múltiple
- Botones de acción

### **Tarea 7**: Validaciones

- No permitir evaluar dos veces la misma postulación
- Validar que solo EVALUADAS pueden ir a APROBADO/RECHAZADO
- Validar que APROBADAS no pueden volver atrás

---

## 🔧 Correcciones Inmediatas

1. **evaluar_lote**: Filtrar solo `puntaje_total__isnull=True`
2. **evaluar (individual)**: Cambiar estado a EVALUADO después de evaluar
3. **exportar_pdf**: Incluir todas las EVALUADAS, no solo las del lote
4. **Frontend**: Mostrar mensaje claro cuando no hay postulaciones RECEPCIONADO **sin puntaje**

---

**Autor**: Sistema DUBSS
**Fecha**: Diciembre 2025
**Versión**: 1.0
