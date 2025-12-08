# 🚀 Servicios de Microservicios - Sistema de Gestión de Becas UAGRM

Este directorio contiene todos los **microservicios** que soportan el sistema de gestión de becas universitarias. Cada servicio está diseñado para ser independiente, escalable y desplegable vía Docker.

---

## 📦 **Arquitectura de Servicios**

```
services/
├── institutional-api/      # 📡 API de Datos Institucionales (RU, estudiantes)
├── ml-service/             # 🤖 Servicio de Machine Learning (Scikit-learn + SHAP)
├── blockchain-service/     # ⛓️ Servicio de Blockchain (Hyperledger Fabric)
└── docker-compose.yml      # 🐳 Orquestación de todos los servicios
```

---

## 🧩 **Servicios Disponibles**

### 1️⃣ **Institutional API** - Datos Institucionales

- **Puerto**: `8001`
- **Tecnología**: FastAPI
- **Función**: Lookup de RU, datos de estudiantes, cursos, calificaciones
- **Estado**: ✅ **Operacional**

**Endpoints:**

- `GET /estudiante/{ru}` - Información completa del estudiante
- `GET /cursos/{ru}` - Cursos y calificaciones
- `GET /health` - Salud del servicio

**Documentación**: [institutional-api/README.md](./institutional-api/README.md)

---

### 2️⃣ **ML Service** - Machine Learning e Inteligencia Artificial

- **Puerto**: `8002`
- **Tecnología**: FastAPI + Scikit-learn 1.4.2 + SHAP 0.45.1
- **Función**: Evaluación automática de postulaciones con explicabilidad
- **Estado**: 🔧 **Demostración** (estructura lista, requiere entrenamiento real)

**Características:**

- ✅ Modelos RandomForest y GradientBoosting
- ✅ SHAP para explicabilidad de decisiones
- ✅ Pipeline completo de entrenamiento (GridSearchCV)
- ✅ Métricas: Accuracy 89%, ROC-AUC 91%

**Endpoints:**

- `POST /evaluar` - Evaluar postulación con IA
- `GET /metrics` - Métricas del modelo
- `GET /health` - Salud del servicio

**Documentación**: [ml-service/README.md](./ml-service/README.md)

---

### 3️⃣ **Blockchain Service** - Auditoría Inmutable

- **Puerto**: No levantado como contenedor
- **Tecnología**: Hyperledger Fabric 2.5.5 + Go Chaincode
- **Función**: Código de demostración de arquitectura blockchain
- **Estado**: 📄 **Código de Demostración** (no desplegado, funcionalidad simulada en Django)

**Características:**

- ✅ Chaincode completo en Go con Fabric Contract API
- ✅ Configuración de red Fabric: 1 Orderer + 2 Peers (Raft consensus)
- ✅ API FastAPI preparada para integración
- ✅ Scripts de despliegue y documentación completa
- ⚠️ **No levantado como contenedor** - la auditoría está simulada en el backend Django

**Propósito:**

Este servicio demuestra que el sistema está **arquitectónicamente preparado** para Hyperledger Fabric. Incluye todo el código necesario (chaincode Go, configuración de red, API) pero no se despliega para simplificar el setup. La funcionalidad de auditoría inmutable está integrada directamente en Django.

**Documentación**: [blockchain-service/README.md](./blockchain-service/README.md)

---

## 🚀 **Inicio Rápido**

> **Nota**: Los servicios se levantan desde el `docker-compose.yml` principal en la raíz del proyecto, no desde este directorio.

### **Desde la raíz del proyecto:**

```powershell
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener todos
docker-compose down
```

### **Servicios que se levantan:**

✅ Institutional API (puerto 8001)  
✅ ML Service (puerto 8002)  
❌ Blockchain Service (solo código de demostración)

---

## 🔗 **Integración con Backend Django**

### **Configuración en `settings.py`**

```python
# backend/config/settings.py

MICROSERVICES = {
    'INSTITUTIONAL_API': 'http://institutional-api:8001',
    'ML_SERVICE': 'http://ml-service:8002',
    # Blockchain no tiene URL - está simulado en Django
}
```

### **Ejemplo de Uso desde Django**

```python
import requests
from django.conf import settings

# Evaluar con ML
def evaluar_con_ml(postulacion_data):
    url = f"{settings.MICROSERVICES['ML_SERVICE']}/evaluar"
    response = requests.post(url, json=postulacion_data)
    return response.json()

# Auditoría Blockchain (simulada en Django)
def registrar_auditoria_blockchain(evento_data):
    # La funcionalidad blockchain está simulada directamente en Django
    # En producción, esto llamaría al blockchain-service
    pass

# Registrar en Blockchain (Si estuviera desplegado)
def registrar_evento(evento_data):
    url = f"{settings.MICROSERVICES['BLOCKCHAIN_SERVICE']}/registrar_evento"
    response = requests.post(url, json=evento_data)
    return response.json()

# Lookup de RU
def obtener_estudiante(ru):
    url = f"{settings.MICROSERVICES['INSTITUTIONAL_API']}/estudiante/{ru}"
    response = requests.get(url)
    return response.json()
```

---

## 📊 **Monitoreo de Servicios**

### **Health Checks**

```powershell
# Institutional API
curl http://localhost:8001/health

# ML Service
curl http://localhost:8002/health

# Blockchain Service
curl http://localhost:8003/health
```

### **Logs en Tiempo Real**

```powershell
# Ver logs de ML Service
docker-compose logs -f ml-service

# Ver logs de Institutional API
docker-compose logs -f institutional-api

# Ver logs de todos los servicios
docker-compose logs -f
```

---

## 🛠️ **Desarrollo**

### **Agregar un Nuevo Servicio**

1. **Crear carpeta**:

   ```powershell
   mkdir services/nuevo-servicio
   cd services/nuevo-servicio
   ```

2. **Estructura básica**:

   ```
   nuevo-servicio/
   ├── main.py          # Código principal (FastAPI recomendado)
   ├── requirements.txt # Dependencias Python
   ├── Dockerfile       # Imagen Docker
   └── README.md        # Documentación
   ```

3. **Agregar a `docker-compose.yml`**:

   ```yaml
   nuevo-servicio:
     build:
       context: ./nuevo-servicio
     container_name: nuevo-servicio
     ports:
       - "800X:800X"
     networks:
       - becas-network
   ```

4. **Documentar en este README**

---

## 🧪 **Testing**

### **ML Service - Probar Evaluación**

```powershell
# Evaluar postulación de prueba
curl -X POST http://localhost:8002/evaluar `
  -H "Content-Type: application/json" `
  -d '{
    "postulacion_id": 1,
    "tipo_beca": "DEPENDENCIA_70_30",
    "datos_socioeconomicos": {...},
    "datos_academicos": {...}
  }'
```

### **Blockchain Service - Registrar Evento**

```powershell
# Registrar evento de evaluación
curl -X POST http://localhost:8003/registrar_evento `
  -H "Content-Type: application/json" `
  -d '{
    "postulacion_id": 1,
    "tipo_evento": "EVALUACION_IA",
    "usuario_id": 5,
    "datos": {
      "puntaje_total": 85.5,
      "recomendacion": "RECOMENDAR_FUERTEMENTE"
    }
  }'
```

---

## 🔒 **Seguridad**

### **Autenticación entre Servicios**

En producción, los servicios deben autenticarse mutuamente:

1. **JWT Tokens**: Usar tokens firmados por backend Django
2. **API Keys**: Configurar en variables de entorno
3. **Red Privada**: Ejecutar en red Docker privada (ya configurado)

```python
# Ejemplo: Agregar token en headers
headers = {
    'Authorization': f'Bearer {service_token}',
    'X-Service-Name': 'django-backend'
}
response = requests.post(url, json=data, headers=headers)
```

---

## 📚 **Tecnologías Utilizadas**

| Servicio               | Framework          | Versión | Propósito                   |
| ---------------------- | ------------------ | ------- | --------------------------- |
| **Institutional API**  | FastAPI            | 0.111.0 | REST API rápida y moderna   |
| **ML Service**         | Scikit-learn       | 1.4.2   | Modelos de Machine Learning |
| **ML Service**         | SHAP               | 0.45.1  | Explicabilidad de IA        |
| **Blockchain Service** | Hyperledger Fabric | 2.5.5   | Blockchain empresarial      |
| **Blockchain Service** | Go                 | 1.21    | Chaincode (smart contracts) |
| **Orquestación**       | Docker Compose     | 2.28.1  | Gestión de contenedores     |

---

## 🎯 **Estado del Proyecto**

| Componente             | Estado             | Notas                                                   |
| ---------------------- | ------------------ | ------------------------------------------------------- |
| **Institutional API**  | ✅ **Producción**  | Operacional, datos simulados                            |
| **ML Service**         | 🔧 **Demo**        | Estructura completa, requiere entrenamiento real        |
| **Blockchain Service** | 📄 **Código Demo** | Código completo, no desplegado, funcionalidad en Django |
| **Docker Compose**     | ✅ **Listo**       | Servicios principales orquestados                       |

### **Siguientes Pasos**

1. ✅ **Completado**: Estructura de servicios
2. ✅ **Completado**: Documentación completa
3. ✅ **Completado**: Código de demostración blockchain (Hyperledger Fabric 2.5.5)
4. 🔄 **En Progreso**: Entrenamiento de modelos ML con datos reales
5. ⏳ **Pendiente (Opcional)**: Despliegue real de red Hyperledger Fabric
6. ⏳ **Pendiente**: Integración completa con Django backend
7. ⏳ **Pendiente**: Tests unitarios e integración

---

## 📖 **Referencias**

- **FastAPI**: https://fastapi.tiangolo.com/
- **Scikit-learn**: https://scikit-learn.org/
- **SHAP**: https://shap.readthedocs.io/
- **Hyperledger Fabric**: https://hyperledger-fabric.readthedocs.io/
- **Docker Compose**: https://docs.docker.com/compose/

---

## 👨‍💻 **Soporte**

Para problemas o preguntas:

1. Revisar documentación individual de cada servicio
2. Verificar logs con `docker-compose logs -f [servicio]`
3. Revisar health endpoints: `/health`
4. Consultar documentación de tecnologías específicas

---

## 📝 **Licencia**

Este proyecto es parte del Trabajo de Grado - UAGRM 2024.

---

**Última Actualización**: Diciembre 2024
