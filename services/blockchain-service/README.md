# Blockchain Service - Hyperledger Fabric (DEMOSTRACIÓN)

> ⚠️ **IMPORTANTE**: Este es un **servicio de demostración** que muestra la arquitectura completa de integración con Hyperledger Fabric 2.5.5. El código, chaincode, y configuración de red son **reales y funcionales**, pero **no se levantan como contenedores** para simplificar el despliegue. La funcionalidad de auditoría blockchain está **simulada directamente en el backend Django**.

## Propósito

Este directorio demuestra que el sistema está **arquitectónicamente preparado** para integrar blockchain empresarial (Hyperledger Fabric) cuando sea necesario en producción. Incluye:

✅ Chaincode completo en Go con Fabric Contract API  
✅ Configuración de red Fabric (Orderer + Peers)  
✅ API FastAPI para integración con Django  
✅ Scripts de despliegue y documentación completa

## Tecnología

- **Hyperledger Fabric 2.5.5**: Blockchain empresarial permisionado
- **FastAPI 0.111**: API REST para interactuar con el blockchain
- **Go 1.21**: Lenguaje del chaincode

## Arquitectura

```
blockchain-service/
├── main.py                          # API FastAPI
├── requirements.txt                 # Dependencias Python
├── chaincode/                       # Smart Contracts (Go)
│   └── auditoria_becas.go          # Chaincode de auditoría
└── network/                         # Configuración de red Fabric
    ├── docker-compose.yaml         # Contenedores de la red
    ├── start-network.sh            # Script de inicialización
    ├── crypto-config.yaml          # Configuración de certificados
    └── configtx.yaml               # Configuración de canal
```

## Componentes de la Red

### Nodos

- **1 Orderer**: orderer.becas.uagrm.edu.bo

  - Algoritmo de consenso: **Raft**
  - Puerto: 7050

- **2 Peers** (Org1 - UAGRM):
  - peer0.org1.becas.uagrm.edu.bo:7051
  - peer1.org1.becas.uagrm.edu.bo:8051

### Canal

- **Nombre**: becas-channel
- **Organizaciones**: Org1 (UAGRM)
- **Chaincode**: auditoria-becas v1.0

## Chaincode: auditoria-becas

El chaincode gestiona el registro inmutable de eventos:

### Funciones

**RegistrarEvento()**

- Registra un nuevo evento en el ledger
- Parámetros: ID, tipo, postulación ID, usuario, datos
- Retorna: Transaction ID, block number

**ConsultarEvento(id)**

- Consulta un evento específico
- Retorna: Datos completos del evento

**ObtenerHistorial(postulacionID)**

- Obtiene todos los eventos de una postulación
- Ordenados cronológicamente
- Retorna: Array de eventos

**VerificarIntegridad(postulacionID)**

- Verifica que los datos no hayan sido alterados
- Compara hash del blockchain con datos actuales

### Tipos de Eventos Registrados

```
- POSTULACION_CREADA
- POSTULACION_ENVIADA
- EVALUACION_IA
- EVALUACION_MANUAL
- ENVIO_CONSEJO
- DECISION_CONSEJO
- BECA_ASIGNADA
- BECA_RECHAZADA
- DOCUMENTO_SUBIDO
- CAMBIO_ESTADO
```

## ⚙️ Despliegue (Si se quisiera activar en producción)

### Iniciar la Red

```bash
cd network/

# Dar permisos de ejecución
chmod +x start-network.sh

# Iniciar red Fabric
./start-network.sh
```

El script:

1. Genera certificados (cryptogen)
2. Crea bloque génesis
3. Levanta contenedores (orderer + peers)
4. Crea canal 'becas-channel'
5. Une peers al canal
6. Instala y activa chaincode

### Iniciar API

```bash
# Instalar dependencias
pip install -r requirements.txt

# Iniciar servicio
uvicorn main:app --reload --port 8003
```

## 📖 Uso de la API (Demostración)

> **Nota**: Estos endpoints están implementados pero no activos. Muestran cómo se integraría Django con el blockchain.

### Registrar Evento

```bash
POST http://localhost:8003/registrar_evento

{
  "tipo_evento": "EVALUACION_IA",
  "postulacion_id": "uuid-postulacion",
  "usuario_id": "uuid-usuario",
  "usuario_nombre": "Juan Pérez",
  "datos_evento": {
    "puntaje_total": 78.5,
    "recomendacion": "APROBADO",
    "modelo_version": "v1.2"
  },
  "metadata": {
    "ip": "192.168.1.100",
    "timestamp": "2025-12-07T10:30:00"
  }
}
```

**Respuesta:**

```json
{
  "success": true,
  "transaction_id": "abc123...",
  "block_number": 1524,
  "timestamp": "2025-12-07T10:30:01",
  "hash": "def456..."
}
```

### Consultar Historial

```bash
GET http://localhost:8003/historial/uuid-postulacion
```

**Respuesta:**

```json
{
  "postulacion_id": "uuid-postulacion",
  "total_eventos": 5,
  "historial": [
    {
      "tipo": "POSTULACION_CREADA",
      "timestamp": "2025-11-01T08:00:00",
      "block_number": 1001,
      "transaction_id": "tx001..."
    },
    {
      "tipo": "EVALUACION_IA",
      "timestamp": "2025-11-15T10:30:00",
      "block_number": 1524,
      "transaction_id": "tx524..."
    }
  ],
  "verificado_blockchain": true
}
```

### Verificar Integridad

```bash
POST http://localhost:8003/verificar_integridad

{
  "postulacion_id": "uuid-postulacion"
}
```

## Integración con Backend Django

```python
# backend/utils/blockchain.py
import requests

def registrar_evento_blockchain(tipo_evento, postulacion_id, usuario, datos):
    """Registra un evento en el blockchain"""
    try:
        response = requests.post(
            'http://blockchain-service:8003/registrar_evento',
            json={
                'tipo_evento': tipo_evento,
                'postulacion_id': str(postulacion_id),
                'usuario_id': str(usuario.id),
                'usuario_nombre': usuario.nombre,
                'datos_evento': datos
            },
            timeout=10
        )
        return response.json()
    except Exception as e:
        logger.error(f"Error registrando en blockchain: {e}")
        return None

# Uso en views.py
from utils.blockchain import registrar_evento_blockchain

# Al crear evaluación IA
registrar_evento_blockchain(
    tipo_evento='EVALUACION_IA',
    postulacion_id=postulacion.id,
    usuario=request.user,
    datos={
        'puntaje_total': float(evaluacion.puntaje_total),
        'recomendacion': evaluacion.recomendacion,
        'modelo_version': 'v1.2'
    }
)
```

## Características del Blockchain

### Inmutabilidad

- Eventos no pueden ser modificados ni eliminados
- Cada cambio genera un nuevo bloque
- Hash criptográfico garantiza integridad

### Trazabilidad

- Historial completo de cada postulación
- Timestamps precisos de cada acción
- Auditoría de quién hizo qué y cuándo

### Transparencia

- Todos los eventos son consultables
- Verificación independiente de integridad
- Prueba criptográfica de autenticidad

### Consenso

- Algoritmo Raft para ordering
- 2 peers validan cada transacción
- Tolerancia a fallas bizantinas

## Comandos Útiles

```bash
# Ver estado de contenedores
docker ps

# Ver logs del orderer
docker logs -f orderer.becas.uagrm.edu.bo

# Ver logs de peer0
docker logs -f peer0.org1.becas.uagrm.edu.bo

# Consultar blockchain via CLI
docker exec cli peer channel getinfo -c becas-channel

# Ver bloques del canal
docker exec cli peer channel fetch newest -c becas-channel

# Detener red
cd network/
docker-compose down

# Limpiar volúmenes
docker-compose down -v
```

## Métricas y Monitoreo

La red expone métricas Prometheus en:

- Orderer: http://localhost:9443/metrics
- Peer0: http://localhost:9444/metrics
- Peer1: http://localhost:9445/metrics

## Seguridad

- **TLS**: Comunicación encriptada entre nodos
- **MSP**: Membership Service Provider para identidades
- **ACL**: Control de acceso por organización
- **Certificados**: PKI con CA (Certificate Authority)

## Autor

Sistema de Gestión de Becas - UAGRM
Hyperledger Fabric 2.5.5
