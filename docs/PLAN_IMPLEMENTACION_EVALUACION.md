# Plan de Implementación - Sistema de Evaluación Completo

## 📋 Resumen del Flujo Completo

```
POSTULACIÓN RECEPCIONADA
    ↓
[FASE 1] Evaluación IA/ML (Scikit-learn + SHAP)
    ├── Individual: Analista evalúa 1 postulante
    └── Lote: Analista evalúa 3+ postulantes
    ↓
Estado: EN_REVISION (con puntaje_ia y explicación SHAP)
    ↓
[FASE 2] Evaluación Manual (Analista revisa datos)
    ├── Formulario socioeconómico
    ├── Formulario académico
    └── Observaciones del analista
    ↓
Estado: EVALUADA (con puntaje_final = puntaje_ia + ajustes_manuales)
    ↓
[FASE 3] Selección para Consejo
    ├── Director/Analista marca top N postulantes
    └── Estado: PARA_CONSEJO
    ↓
Reunión Consejo (fuera del sistema)
    ↓
[FASE 4] Asignación de Becas
    ├── Director asigna beca a aprobados
    ├── Estado: APROBADA
    └── Rol: ESTUDIANTE_POSTULANTE → ESTUDIANTE_BECADO
    ↓
[FASE 5] Seguimiento Académico
    ├── Panel específico para becados
    ├── Subida de documentos mensuales
    └── Revisión por Responsable de Seguimiento
    ↓
[FASE 6] Auditoría (Hyperledger Fabric)
    └── Registro inmutable de eventos críticos
```

---

## 🎯 FASE 1: Evaluación IA/ML con SHAP

### Objetivo

Usar Scikit-learn para entrenar un modelo predictivo y SHAP para explicar las decisiones del modelo.

### 1.1 Backend - Microservicio ML con FastAPI

**Archivo:** `services/ml-service/main.py`

```python
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import shap
import numpy as np

app = FastAPI()

# Cargar modelo pre-entrenado
modelo = joblib.load('models/modelo_becas.pkl')
explainer = shap.TreeExplainer(modelo)

class DatosPostulante(BaseModel):
    ingreso_familiar: float
    numero_dependientes: int
    promedio_academico: float
    actividades_extracurriculares: int
    situacion_especial: bool
    # ... más campos

@app.post("/evaluar")
def evaluar_postulante(datos: DatosPostulante):
    # Preparar features
    X = np.array([[
        datos.ingreso_familiar,
        datos.numero_dependientes,
        datos.promedio_academico,
        # ...
    ]])

    # Predecir
    puntaje = modelo.predict_proba(X)[0][1] * 100

    # Explicar con SHAP
    shap_values = explainer.shap_values(X)

    return {
        "puntaje_predicho": round(puntaje, 2),
        "recomendacion": "APROBADO" if puntaje >= 70 else "RECHAZADO",
        "confianza": round(modelo.predict_proba(X).max() * 100, 2),
        "shap_values": shap_values[0].tolist(),
        "feature_names": [...],
        "base_value": explainer.expected_value
    }
```

**Tecnologías:**

- ✅ FastAPI 0.111
- ✅ Scikit-learn 1.4.2
- ✅ SHAP 0.45.1

---

### 1.2 Backend Django - Integración con ML Service

**Archivo:** `backend/postulaciones/views.py`

Mejorar el método `evaluar_ia`:

```python
@action(detail=True, methods=['post'], permission_classes=[IsDirectorOrAnalista])
def evaluar_ia(self, request, pk=None):
    """Evaluar postulante con IA/ML"""
    postulacion = self.get_object()

    # Validaciones previas...

    # Preparar datos del postulante
    datos_socioeconomicos = postulacion.formulario_socioeconomico
    datos_academicos = postulacion.formulario_academico

    # Llamar al microservicio ML
    try:
        response = requests.post(
            'http://ml-service:8001/evaluar',
            json={
                'ingreso_familiar': datos_socioeconomicos.ingreso_familiar,
                'numero_dependientes': datos_socioeconomicos.numero_dependientes,
                'promedio_academico': datos_academicos.promedio,
                # ... más campos
            },
            timeout=30
        )
        resultado_ia = response.json()
    except Exception as e:
        return Response({'error': f'Error al contactar ML service: {str(e)}'},
                       status=500)

    # Aplicar ponderaciones según tipo de beca
    ponderaciones = postulacion.tipo_beca_solicitada.get_ponderaciones()

    # Crear evaluación IA
    evaluacion = EvaluacionIA.objects.create(
        postulacion=postulacion,
        puntaje_socioeconomico=resultado_ia['puntaje_socioeconomico'],
        puntaje_academico=resultado_ia['puntaje_academico'],
        puntaje_total=resultado_ia['puntaje_total'],
        explicacion_shap=resultado_ia['shap_values'],
        features_importantes=resultado_ia['top_features'],
        recomendacion=resultado_ia['recomendacion'],
        confianza=resultado_ia['confianza'],
        evaluado_por_usuario=request.user
    )

    # Actualizar postulación
    postulacion.puntaje_total = resultado_ia['puntaje_total']
    postulacion.estado = Postulacion.EstadoChoices.EN_REVISION
    postulacion.save()

    return Response(EvaluacionIASerializer(evaluacion).data)
```

---

### 1.3 Backend - Evaluación en Lote (Batch)

**Nuevo endpoint:** `evaluar_lote`

```python
@action(detail=False, methods=['post'], permission_classes=[IsDirectorOrAnalista])
def evaluar_lote(self, request):
    """Evaluar múltiples postulaciones en lote"""
    postulacion_ids = request.data.get('postulacion_ids', [])

    if len(postulacion_ids) > 100:
        return Response({'error': 'Máximo 100 postulaciones por lote'},
                       status=400)

    postulaciones = Postulacion.objects.filter(
        id__in=postulacion_ids,
        estado=Postulacion.EstadoChoices.RECEPCIONADO
    )

    resultados = []
    errores = []

    for postulacion in postulaciones:
        try:
            # Llamar al ML service
            resultado = evaluar_con_ia(postulacion)
            resultados.append({
                'id': postulacion.id,
                'estudiante': postulacion.estudiante.nombre,
                'puntaje': resultado['puntaje_total'],
                'recomendacion': resultado['recomendacion']
            })
        except Exception as e:
            errores.append({
                'id': postulacion.id,
                'error': str(e)
            })

    return Response({
        'evaluados': len(resultados),
        'errores': len(errores),
        'resultados': resultados,
        'errores_detalle': errores
    })
```

---

### 1.4 Frontend - Botón Evaluar Individual

**Archivo:** `frontend/src/app/admin/postulaciones/[id]/page.tsx`

```tsx
const handleEvaluarIA = async () => {
  try {
    setLoading(true);
    const response = await fetch(
      `http://localhost:8000/api/postulaciones/${params.id}/evaluar_ia/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) throw new Error("Error al evaluar con IA");

    const data = await response.json();

    // Mostrar resultados
    setEvaluacionIA(data);
    setDialogResultados(true);

    // Recargar postulación
    fetchPostulacion();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Dialog para mostrar resultados SHAP
<Dialog open={dialogResultados} maxWidth="md" fullWidth>
  <DialogTitle>Resultado Evaluación IA</DialogTitle>
  <DialogContent>
    <Typography variant="h6">
      Puntaje Total: {evaluacionIA?.puntaje_total}
    </Typography>
    <Typography>Recomendación: {evaluacionIA?.recomendacion}</Typography>
    <Typography>Confianza: {evaluacionIA?.confianza}%</Typography>

    {/* Visualización SHAP */}
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2">Factores más importantes:</Typography>
      {evaluacionIA?.features_importantes?.map((feature, idx) => (
        <Box key={idx} sx={{ display: "flex", gap: 2 }}>
          <Typography>{feature.nombre}</Typography>
          <Typography
            color={feature.impacto > 0 ? "success.main" : "error.main"}
          >
            {feature.impacto > 0 ? "+" : ""}
            {feature.impacto}
          </Typography>
        </Box>
      ))}
    </Box>
  </DialogContent>
</Dialog>;
```

---

### 1.5 Frontend - Evaluación en Lote

**Archivo:** `frontend/src/app/admin/postulaciones/page.tsx`

```tsx
const [seleccionadas, setSeleccionadas] = useState<string[]>([]);

const handleEvaluarLote = async () => {
  if (seleccionadas.length === 0) {
    alert("Selecciona al menos una postulación");
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8000/api/postulaciones/evaluar_lote/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ postulacion_ids: seleccionadas }),
      }
    );

    const data = await response.json();

    alert(`Evaluadas: ${data.evaluados}, Errores: ${data.errores}`);
    fetchPostulaciones();
    setSeleccionadas([]);
  } catch (err) {
    setError(err.message);
  }
};

// Tabla con checkboxes
<TableCell>
  <Checkbox
    checked={seleccionadas.includes(post.id)}
    onChange={(e) => {
      if (e.target.checked) {
        setSeleccionadas([...seleccionadas, post.id]);
      } else {
        setSeleccionadas(seleccionadas.filter((id) => id !== post.id));
      }
    }}
  />
</TableCell>;
```

---

## 🎯 FASE 2: Evaluación Manual (Analista)

### Objetivo

El analista revisa manualmente los formularios y puede ajustar el puntaje de la IA.

### 2.1 Backend - Modelo EvaluacionManual

**Archivo:** `backend/postulaciones/models.py`

```python
class EvaluacionManual(models.Model):
    """Evaluación manual del analista"""

    postulacion = models.OneToOneField(
        Postulacion,
        on_delete=models.CASCADE,
        related_name='evaluacion_manual'
    )

    # Puntajes manuales
    puntaje_socioeconomico_manual = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    puntaje_academico_manual = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    puntaje_total_final = models.DecimalField(
        max_digits=5, decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Observaciones
    observaciones_socioeconomicas = models.TextField(blank=True)
    observaciones_academicas = models.TextField(blank=True)
    observaciones_generales = models.TextField(blank=True)

    # Verificaciones
    documentos_verificados = models.BooleanField(default=False)
    informacion_validada = models.BooleanField(default=False)

    # Auditoría
    evaluado_por = models.ForeignKey(Usuario, on_delete=models.PROTECT)
    fecha_evaluacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluacion_manual'
        verbose_name = 'Evaluación Manual'
```

---

### 2.2 Backend - Endpoint Evaluación Manual

```python
@action(detail=True, methods=['post'], permission_classes=[IsDirectorOrAnalista])
def evaluar_manual(self, request, pk=None):
    """Evaluación manual por analista"""
    postulacion = self.get_object()

    # Validar que ya pasó por IA
    if not hasattr(postulacion, 'evaluacion_ia'):
        return Response(
            {'error': 'Debe evaluar primero con IA'},
            status=400
        )

    if postulacion.estado != Postulacion.EstadoChoices.EN_REVISION:
        return Response(
            {'error': 'La postulación no está en revisión'},
            status=400
        )

    # Crear o actualizar evaluación manual
    evaluacion, created = EvaluacionManual.objects.update_or_create(
        postulacion=postulacion,
        defaults={
            'puntaje_socioeconomico_manual': request.data['puntaje_socioeconomico'],
            'puntaje_academico_manual': request.data['puntaje_academico'],
            'puntaje_total_final': request.data['puntaje_total'],
            'observaciones_socioeconomicas': request.data.get('obs_socio', ''),
            'observaciones_academicas': request.data.get('obs_academico', ''),
            'observaciones_generales': request.data.get('obs_general', ''),
            'documentos_verificados': request.data.get('docs_ok', False),
            'informacion_validada': request.data.get('info_ok', False),
            'evaluado_por': request.user
        }
    )

    # Actualizar postulación
    postulacion.puntaje_total = evaluacion.puntaje_total_final
    postulacion.estado = Postulacion.EstadoChoices.EVALUADA
    postulacion.save()

    return Response(EvaluacionManualSerializer(evaluacion).data)
```

---

### 2.3 Frontend - Formulario Evaluación Manual

```tsx
<Dialog open={dialogEvaluarManual} maxWidth="md" fullWidth>
  <DialogTitle>Evaluación Manual</DialogTitle>
  <DialogContent>
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="subtitle2">Evaluación IA:</Typography>
      <Typography>Puntaje Total: {evaluacionIA?.puntaje_total}</Typography>
      <Typography>Recomendación: {evaluacionIA?.recomendacion}</Typography>
    </Alert>

    <Grid container spacing={2}>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Puntaje Socioeconómico Manual"
          value={puntajeSocio}
          onChange={(e) => setPuntajeSocio(Number(e.target.value))}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
        />
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          type="number"
          label="Puntaje Académico Manual"
          value={puntajeAcademico}
          onChange={(e) => setPuntajeAcademico(Number(e.target.value))}
          inputProps={{ min: 0, max: 100, step: 0.1 }}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="h6">
          Puntaje Total Final: {calcularPuntajeFinal()}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Observaciones Socioeconómicas"
          value={obsSocio}
          onChange={(e) => setObsSocio(e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={docsVerificados}
              onChange={(e) => setDocsVerificados(e.target.checked)}
            />
          }
          label="Documentos verificados y completos"
        />
      </Grid>
    </Grid>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDialogEvaluarManual(false)}>Cancelar</Button>
    <Button variant="contained" onClick={handleGuardarEvaluacionManual}>
      Guardar Evaluación
    </Button>
  </DialogActions>
</Dialog>
```

---

## 🎯 FASE 3: Consejo y Asignación

### 3.1 Backend - Estado PARA_CONSEJO

Agregar a `Postulacion.EstadoChoices`:

```python
PARA_CONSEJO = 'PARA_CONSEJO', 'Para Consejo'
APROBADA = 'APROBADA', 'Aprobada'
RECHAZADA = 'RECHAZADA', 'Rechazada'
BECA_ASIGNADA = 'BECA_ASIGNADA', 'Beca Asignada'
```

---

### 3.2 Backend - Endpoint Enviar a Consejo

```python
@action(detail=False, methods=['post'], permission_classes=[IsDirectorOrAnalista])
def enviar_a_consejo(self, request):
    """Seleccionar postulantes para consejo"""
    postulacion_ids = request.data.get('postulacion_ids', [])

    postulaciones = Postulacion.objects.filter(
        id__in=postulacion_ids,
        estado=Postulacion.EstadoChoices.EVALUADA
    )

    postulaciones.update(estado=Postulacion.EstadoChoices.PARA_CONSEJO)

    return Response({
        'mensaje': f'{postulaciones.count()} postulaciones enviadas a consejo'
    })
```

---

### 3.3 Backend - Endpoint Asignar Beca

```python
@action(detail=True, methods=['post'], permission_classes=[IsDirector])
def asignar_beca(self, request, pk=None):
    """Asignar beca a postulante aprobado por consejo"""
    postulacion = self.get_object()

    if postulacion.estado != Postulacion.EstadoChoices.PARA_CONSEJO:
        return Response(
            {'error': 'La postulación no está en consejo'},
            status=400
        )

    # Actualizar postulación
    postulacion.estado = Postulacion.EstadoChoices.BECA_ASIGNADA
    postulacion.fecha_asignacion = timezone.now()
    postulacion.save()

    # Cambiar rol del estudiante
    estudiante = postulacion.estudiante
    estudiante.rol = 'ESTUDIANTE_BECADO'
    estudiante.save()

    # Crear registro de seguimiento
    SeguimientoBeca.objects.create(
        postulacion=postulacion,
        estudiante=estudiante,
        tipo_beca=postulacion.tipo_beca_solicitada,
        fecha_inicio=timezone.now(),
        estado='ACTIVA'
    )

    # Registrar en blockchain (Hyperledger Fabric)
    registrar_evento_blockchain({
        'tipo': 'ASIGNACION_BECA',
        'postulacion_id': str(postulacion.id),
        'estudiante_id': estudiante.ci,
        'tipo_beca': postulacion.tipo_beca_solicitada.codigo,
        'fecha': timezone.now().isoformat(),
        'autorizado_por': request.user.correo
    })

    return Response({
        'mensaje': 'Beca asignada exitosamente',
        'estudiante_id': estudiante.id,
        'nuevo_rol': estudiante.rol
    })
```

---

## 🎯 FASE 4: Panel Estudiante Becado

### 4.1 Backend - Modelo DocumentoSeguimiento

```python
class DocumentoSeguimiento(models.Model):
    """Documentos de seguimiento para estudiantes becados"""

    class TipoDocumento(models.TextChoices):
        INFORME_MENSUAL = 'INFORME_MENSUAL', 'Informe Mensual'
        CERTIFICADO_NOTAS = 'CERTIFICADO_NOTAS', 'Certificado de Notas'
        ASISTENCIA = 'ASISTENCIA', 'Certificado de Asistencia'
        OTRO = 'OTRO', 'Otro'

    seguimiento = models.ForeignKey(
        'SeguimientoBeca',
        on_delete=models.CASCADE,
        related_name='documentos'
    )

    tipo_documento = models.CharField(
        max_length=20,
        choices=TipoDocumento.choices
    )

    mes_reportado = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    anio_reportado = models.IntegerField()

    archivo_url = models.URLField()  # MinIO URL
    archivo_nombre = models.CharField(max_length=255)
    archivo_tamanio = models.IntegerField()

    observaciones = models.TextField(blank=True)

    # Revisión
    revisado = models.BooleanField(default=False)
    revisado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='documentos_revisados'
    )
    fecha_revision = models.DateTimeField(null=True, blank=True)
    comentarios_revision = models.TextField(blank=True)

    fecha_subida = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'documento_seguimiento'
        unique_together = ['seguimiento', 'tipo_documento', 'mes_reportado', 'anio_reportado']
```

---

### 4.2 Frontend - Panel Estudiante Becado

**Archivo:** `frontend/src/app/becado/seguimiento/page.tsx`

```tsx
"use client";

export default function SeguimientoBecadoPage() {
  const { user, token } = useAuthStore();
  const [seguimiento, setSeguimiento] = useState(null);
  const [documentos, setDocumentos] = useState([]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mi Beca - Seguimiento
      </Typography>

      <Grid container spacing={3}>
        {/* Información de la beca */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">
                {seguimiento?.tipo_beca?.nombre}
              </Typography>
              <Typography color="text.secondary">
                Monto: Bs. {seguimiento?.tipo_beca?.monto_mensual}/mes
              </Typography>
              <Typography>Estado: {seguimiento?.estado}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Subir documentos */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subir Documento de Seguimiento
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Documento</InputLabel>
                  <Select>
                    <MenuItem value="INFORME_MENSUAL">Informe Mensual</MenuItem>
                    <MenuItem value="CERTIFICADO_NOTAS">
                      Certificado Notas
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={3}>
                <FormControl fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select>{/* 1-12 */}</Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Button variant="contained" component="label">
                  Seleccionar Archivo
                  <input type="file" hidden onChange={handleFileChange} />
                </Button>
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!archivo}
                >
                  Subir Documento
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Historial de documentos */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Mes/Año</TableCell>
                  <TableCell>Fecha Subida</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>{doc.tipo_documento}</TableCell>
                    <TableCell>
                      {doc.mes_reportado}/{doc.anio_reportado}
                    </TableCell>
                    <TableCell>
                      {new Date(doc.fecha_subida).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.revisado ? "Revisado" : "Pendiente"}
                        color={doc.revisado ? "success" : "warning"}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => descargarDocumento(doc)}>
                        <DownloadIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
}
```

---

## 🎯 FASE 5: Auditoría con Blockchain

### 5.1 Backend - Integración Hyperledger Fabric

**Archivo:** `backend/blockchain/fabric_client.py`

```python
from hfc.fabric import Client
import asyncio

class FabricBlockchainClient:
    """Cliente para Hyperledger Fabric"""

    def __init__(self):
        self.client = Client(net_profile="network.json")
        self.org = "UAGRM"
        self.user = "admin"
        self.channel_name = "becas-channel"
        self.chaincode_name = "becas-chaincode"

    async def registrar_evento(self, evento: dict):
        """Registrar evento en blockchain"""
        try:
            response = await self.client.chaincode_invoke(
                requestor=self.user,
                channel_name=self.channel_name,
                peers=['peer0.uagrm'],
                chaincode_name=self.chaincode_name,
                fcn='registrarEvento',
                args=[json.dumps(evento)]
            )
            return response
        except Exception as e:
            logger.error(f"Error al registrar en blockchain: {e}")
            return None

    async def consultar_historial(self, postulacion_id: str):
        """Consultar historial de eventos de una postulación"""
        response = await self.client.chaincode_query(
            requestor=self.user,
            channel_name=self.channel_name,
            peers=['peer0.uagrm'],
            chaincode_name=self.chaincode_name,
            fcn='consultarHistorial',
            args=[postulacion_id]
        )
        return json.loads(response)
```

---

### 5.2 Eventos a Registrar en Blockchain

```python
EVENTOS_CRITICOS = [
    'POSTULACION_CREADA',
    'EVALUACION_IA_REALIZADA',
    'EVALUACION_MANUAL_REALIZADA',
    'ENVIADO_A_CONSEJO',
    'BECA_ASIGNADA',
    'BECA_SUSPENDIDA',
    'BECA_FINALIZADA',
    'DOCUMENTO_SEGUIMIENTO_SUBIDO',
    'CAMBIO_ESTADO_POSTULACION'
]

def registrar_evento_blockchain(tipo_evento, datos):
    """Helper para registrar eventos"""
    evento = {
        'tipo': tipo_evento,
        'timestamp': timezone.now().isoformat(),
        'datos': datos,
        'hash_anterior': obtener_ultimo_hash(),
        'firma': generar_firma_digital(datos)
    }

    # Ejecutar async
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(
        blockchain_client.registrar_evento(evento)
    )
```

---

## 📊 Resumen de Tecnologías por Fase

| Fase            | Tecnologías                     |
| --------------- | ------------------------------- |
| Evaluación IA   | Scikit-learn, SHAP, FastAPI     |
| Backend         | Django, DRF, PostgreSQL         |
| Frontend        | React, Next.js, TypeScript, MUI |
| Almacenamiento  | MinIO                           |
| Auditoría       | Hyperledger Fabric              |
| Infraestructura | Docker, Docker Compose          |

---

## 🚀 Orden de Implementación Recomendado

1. ✅ **Semana 1**: FASE 1 - Evaluación IA (items 2-6)
2. ✅ **Semana 2**: FASE 2 - Evaluación Manual (items 8-10)
3. ✅ **Semana 3**: FASE 3 - Consejo y Asignación (items 12-14)
4. ✅ **Semana 4**: FASE 4 - Panel Becado (items 16-19)
5. ✅ **Semana 5**: FASE 5 - Blockchain (items 21-22)

---

## 📝 Notas Importantes

1. **Datos de Entrenamiento ML**: Para las 3 postulaciones de prueba, usar un modelo pre-entrenado con datos sintéticos.

2. **SHAP Visualización**: Usar librería React para gráficos (recharts, nivo).

3. **MinIO**: Ya configurado, solo agregar lógica de seguimiento.

4. **Hyperledger Fabric**: Configurar network básica con 1 org, 1 peer.

5. **Testing**: Crear fixtures para 3 postulaciones de prueba con diferentes perfiles.
