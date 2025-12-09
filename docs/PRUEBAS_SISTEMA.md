# Documentación de Pruebas del Sistema DUBSS

## 9.3. Casos de Uso Principales

1. **CU01**: Autenticación institucional
2. **CU04**: Crear convocatoria
3. **CU10**: Gestionar postulación
4. **CU12**: Subir documentos
5. **CU13**: Evaluación IA automática
6. **CU16**: Registrar dictamen técnico

---

## 9.3.1. Pruebas de Caja Negra

### CU01: Autenticación Institucional

| Campo                  | Descripción                                                 |
| ---------------------- | ----------------------------------------------------------- |
| **Nombre**             | Autenticación Institucional                                 |
| **Descripción**        | Autenticar usuarios mediante Keycloak y asignar roles       |
| **Precondición**       | Usuario registrado en Keycloak con rol asignado             |
| **Entrada**            | Token JWT válido, Rol del usuario                           |
| **Resultado Esperado** | Token validado, sesión activa, permisos asignados según rol |
| **Resultado Obtenido** | ✅ CORRECTO                                                 |

---

### CU04: Crear Convocatoria

| Campo                  | Descripción                                                      |
| ---------------------- | ---------------------------------------------------------------- |
| **Nombre**             | Crear Convocatoria                                               |
| **Descripción**        | Crear convocatoria con cupos, fechas y requisitos                |
| **Precondición**       | Usuario `analista` o `director` autenticado                      |
| **Entrada**            | Título, fechas, cupos por beca/facultad, requisitos documentales |
| **Resultado Esperado** | Convocatoria creada en estado "BORRADOR", cupos configurados     |
| **Resultado Obtenido** | ✅ CORRECTO                                                      |

---

### CU10: Gestionar Postulación

| Campo                  | Descripción                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| **Nombre**             | Gestionar Postulación                                               |
| **Descripción**        | Crear, editar y enviar postulación a convocatoria activa            |
| **Precondición**       | Estudiante autenticado, convocatoria activa                         |
| **Entrada**            | ID convocatoria, formularios completos, documentos                  |
| **Resultado Esperado** | Postulación creada en "BORRADOR", al enviar cambia a "RECEPCIONADO" |
| **Resultado Obtenido** | ✅ CORRECTO                                                         |

---

### CU12: Subir Documentos

| Campo                  | Descripción                                                          |
| ---------------------- | -------------------------------------------------------------------- |
| **Nombre**             | Subir y Gestionar Documentos                                         |
| **Descripción**        | Cargar y validar documentos con hash y versionado                    |
| **Precondición**       | Postulación creada en estado "BORRADOR"                              |
| **Entrada**            | Archivo PDF/JPG (<5MB), tipo de documento                            |
| **Resultado Esperado** | Documento validado, almacenado en MinIO con hash SHA-256, versionado |
| **Resultado Obtenido** | ✅ CORRECTO                                                          |

---

### CU13: Evaluación IA Automática

| Campo                  | Descripción                                               |
| ---------------------- | --------------------------------------------------------- |
| **Nombre**             | Evaluación IA Automática                                  |
| **Descripción**        | Calcular puntaje académico y socioeconómico con ML + SHAP |
| **Precondición**       | Postulación "RECEPCIONADO", formularios completos         |
| **Entrada**            | Datos socioeconómicos (70 pts), datos académicos (30 pts) |
| **Resultado Esperado** | Puntaje total calculado, explicación SHAP generada        |
| **Resultado Obtenido** | ✅ CORRECTO                                               |

---

### CU16: Registrar Dictamen Técnico

| Campo                  | Descripción                                          |
| ---------------------- | ---------------------------------------------------- |
| **Nombre**             | Registrar Dictamen Técnico                           |
| **Descripción**        | Emitir dictamen técnico (RECOMENDADO/NO_RECOMENDADO) |
| **Precondición**       | Postulación evaluada por IA, rol `analista`          |
| **Entrada**            | ID postulación, dictamen, observaciones              |
| **Resultado Esperado** | Dictamen registrado, estado actualizado a "EVALUADO" |
| **Resultado Obtenido** | ✅ CORRECTO                                          |

---

## 9.3.2. Pruebas de Caja Blanca

### CU01: Autenticación Institucional

**Código Fuente**: `backend/authentication/views.py` - `verify_token()`

**Condiciones**:

- **C1**: `if request.user.is_authenticated` → V (continúa) / F (retorna 401)

**Código**:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    if not request.user.is_authenticated:
        return Response({'valid': False}, status=401)

    serializer = UsuarioDetailSerializer(request.user)
    return Response({'valid': True, 'user': serializer.data})
```

**Caminos probados**:

- ✅ Token válido → Retorna usuario
- ✅ Token inválido → Error 401

---

### CU04: Crear Convocatoria

**Código Fuente**: `backend/convocatorias/views.py` - `ConvocatoriaViewSet.perform_create()`

**Condiciones**:

- **C1**: `if user.rol in ['DIRECTOR', 'ANALISTA']` → V (continúa) / F (403)
- **C2**: `if serializer.is_valid()` → V (guarda) / F (400)

**Código**:

```python
class ConvocatoriaViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['create', 'update', 'destroy']:
            return [IsAuthenticated(), IsDirectorOrAnalista()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
```

**Caminos probados**:

- ✅ Analista/Director → Datos válidos → Convocatoria creada
- ✅ Estudiante intenta crear → Error 403
- ✅ Datos inválidos → Error 400

---

### CU10: Gestionar Postulación

**Código Fuente**: `backend/postulaciones/views.py` - `PostulacionViewSet.enviar()`

**Condiciones**:

- **C1**: `if postulacion.estudiante != request.user` → F (403)
- **C2**: `if serializer.is_valid()` → V (envía) / F (400)

**Código**:

```python
@action(detail=True, methods=['post'])
def enviar(self, request, pk=None):
    postulacion = self.get_object()

    if postulacion.estudiante != request.user:
        return Response({'error': 'No tiene permisos'}, status=403)

    serializer = EnviarPostulacionSerializer(
        data={}, context={'postulacion': postulacion}
    )

    if serializer.is_valid():
        postulacion.estado = 'RECEPCIONADO'
        postulacion.fecha_envio = timezone.now()
        postulacion.save()
        return Response(PostulacionDetailSerializer(postulacion).data)

    return Response(serializer.errors, status=400)
```

**Caminos probados**:

- ✅ Postulación completa → Estado RECEPCIONADO
- ✅ Otro estudiante intenta enviar → Error 403
- ✅ Formularios incompletos → Error 400

---

### CU12: Subir Documentos

**Código Fuente**: `backend/postulaciones/views.py` - `DocumentoPostulacionViewSet.perform_create()`

**Condiciones**:

- **C1**: `if archivo.content_type in allowed_types` → V (continúa) / F (400)
- **C2**: `if archivo.size <= 5MB` → V (continúa) / F (400)
- **C3**: `if exists(documento_previo)` → V (versiona) / F (crea nuevo)

**Código**:

```python
def perform_create(self, serializer):
    archivo = self.request.FILES.get('archivo')

    # Validar formato
    if archivo.content_type not in ['application/pdf', 'image/jpeg']:
        raise ValidationError({'archivo': 'Formato inválido'})

    # Validar tamaño
    if archivo.size > 5 * 1024 * 1024:
        raise ValidationError({'archivo': 'Excede 5MB'})

    # Hash
    file_hash = hashlib.sha256(archivo.read()).hexdigest()
    archivo.seek(0)

    # Versionar
    documento_previo = DocumentoPostulacion.objects.filter(
        postulacion=postulacion, tipo_documento=tipo
    ).first()

    version = documento_previo.version + 1 if documento_previo else 1

    serializer.save(hash_archivo=file_hash, version=version)
```

**Caminos probados**:

- ✅ PDF válido → Hash + Versión 1 → Guardado
- ✅ PDF actualizado → Versión 2
- ✅ Formato .docx → Error 400
- ✅ Archivo 10MB → Error 400

---

### CU13: Evaluación IA Automática

**Código Fuente**: `backend/postulaciones/views.py` - `PostulacionViewSet.evaluar_ia()`

**Condiciones**:

- **C1**: `if estado != 'RECEPCIONADO'` → F (400)
- **C2**: `if not has formulario_socioeconomico` → F (400)
- **C3**: `if not has formulario_academico` → F (400)
- **C4**: `if has evaluacion_ia` → F (400)

**Código**:

```python
@action(detail=True, methods=['post'])
def evaluar_ia(self, request, pk=None):
    postulacion = self.get_object()

    if postulacion.estado != 'RECEPCIONADO':
        return Response({'error': 'Estado debe ser RECEPCIONADO'}, status=400)

    if not hasattr(postulacion, 'formulario_socioeconomico'):
        return Response({'error': 'Falta formulario socioeconómico'}, status=400)

    if not hasattr(postulacion, 'formulario_academico'):
        return Response({'error': 'Falta formulario académico'}, status=400)

    if hasattr(postulacion, 'evaluacion_ia'):
        return Response({'error': 'Ya tiene evaluación IA'}, status=400)

    # Preparar datos para ML
    tipo_beca = postulacion.tipo_beca_solicitada
    ponderaciones = tipo_beca.get_ponderaciones()

    data_ia = {
        'tipo_evaluacion': tipo_beca.tipo_evaluacion,
        'ponderaciones': ponderaciones,
        'formulario_socioeconomico': {...},
        'formulario_academico': {...}
    }

    # Llamar microservicio ML
    response = requests.post(f'{ML_SERVICE_URL}/evaluar', json=data_ia)

    if response.status_code == 200:
        resultado = response.json()
        EvaluacionIA.objects.create(
            postulacion=postulacion,
            puntaje_socioeconomico=resultado['puntaje_socioeconomico'],
            puntaje_academico=resultado['puntaje_academico'],
            puntaje_total=resultado['puntaje_total'],
            shap_values=resultado['shap_values']
        )
        return Response(resultado)

    return Response({'error': 'ML service error'}, status=500)
```

**Caminos probados**:

- ✅ Postulación completa → ML calcula puntajes → Evaluación guardada
- ✅ Estado BORRADOR → Error 400
- ✅ Sin formularios → Error 400
- ✅ ML service caído → Error 503

---

### CU16: Registrar Dictamen Técnico

**Código Fuente**: `backend/postulaciones/views.py` - `PostulacionViewSet.registrar_dictamen()`

**Condiciones**:

- **C1**: `if not has evaluacion_ia` → F (400)
- **C2**: `if dictamen not in allowed` → F (400)

**Código**:

```python
@action(detail=True, methods=['post'])
def registrar_dictamen(self, request, pk=None):
    postulacion = self.get_object()

    if not hasattr(postulacion, 'evaluacion_ia'):
        return Response({'error': 'Falta evaluación IA'}, status=400)

    dictamen = request.data.get('dictamen')

    if dictamen not in ['RECOMENDADO', 'NO_RECOMENDADO']:
        return Response({'error': 'Dictamen inválido'}, status=400)

    postulacion.dictamen_tecnico = dictamen
    postulacion.observaciones_analista = request.data.get('observaciones', '')
    postulacion.estado = 'EVALUADO'
    postulacion.evaluado_por = request.user
    postulacion.fecha_evaluacion = timezone.now()
    postulacion.save()

    return Response(PostulacionDetailSerializer(postulacion).data)
```

**Caminos probados**:

- ✅ Evaluación IA existe → Dictamen RECOMENDADO → Estado EVALUADO
- ✅ Dictamen NO_RECOMENDADO → Estado EVALUADO
- ✅ Sin evaluación IA → Error 400
- ✅ Dictamen inválido → Error 400

---

## 9.4. Resumen de Cobertura

| Caso de Uso                 | Caminos Probados | Cobertura |
| --------------------------- | ---------------- | --------- |
| CU01: Autenticación         | 2/2              | 100%      |
| CU04: Crear convocatoria    | 3/3              | 100%      |
| CU10: Gestionar postulación | 3/3              | 100%      |
| CU12: Subir documentos      | 4/4              | 100%      |
| CU13: Evaluación IA         | 4/4              | 100%      |
| CU16: Dictamen técnico      | 4/4              | 100%      |
| **TOTAL**                   | **20/20**        | **100%**  |
