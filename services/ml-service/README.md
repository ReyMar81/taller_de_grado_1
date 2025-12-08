# ML Service - Sistema de Evaluación de Becas

Microservicio de Machine Learning para evaluación automática de postulaciones a becas.

## Tecnologías

- **FastAPI 0.111**: Framework web de alto rendimiento
- **Scikit-learn 1.4.2**: Librería de Machine Learning
- **SHAP 0.45.1**: Explicabilidad de modelos (SHapley Additive exPlanations)

## Estructura del Proyecto

```
ml-service/
├── main.py                    # API FastAPI
├── requirements.txt           # Dependencias Python
├── Dockerfile                 # Contenedor Docker
├── models/                    # Modelos entrenados
│   ├── modelo_dependencia_70_30.pkl
│   ├── modelo_merito_100.pkl
│   ├── scaler.pkl
│   ├── feature_names.pkl
│   ├── metadata.json
│   ├── shap_importance_dependencia.png
│   └── shap_importance_merito.png
├── data/                      # Datos de entrenamiento
│   └── postulaciones_historicas.csv
└── scripts/                   # Scripts de entrenamiento
    └── train_model.py
```

## Modelos Entrenados

### 1. Modelo DEPENDENCIA_70_30

- **Algoritmo**: Random Forest Classifier
- **Uso**: Becas con ponderación 70% socio + 30% académico
- **Accuracy**: 89%
- **ROC-AUC**: 0.91

### 2. Modelo MERITO_100

- **Algoritmo**: Gradient Boosting Classifier
- **Uso**: Becas 100% por excelencia académica
- **Accuracy**: 91%
- **ROC-AUC**: 0.93

## Características del Modelo

**Socioeconómicas (12 features):**

- Número de miembros de familia
- Número de dependientes
- Ingreso per cápita
- Gastos mensuales (vivienda, alimentación, educación, salud, otros)
- Tipo de vivienda
- Discapacidad
- Padre/madre soltero
- Área rural

**Académicas (8 features):**

- Promedio general
- Semestre actual
- Materias aprobadas/reprobadas
- Tasa de aprobación
- Actividades universitarias
- Proyectos de investigación
- Reconocimientos académicos

**Total**: 20 características

## Entrenamiento del Modelo

```bash
# Instalar dependencias
pip install -r requirements.txt

# Entrenar modelos
python scripts/train_model.py
```

El script de entrenamiento:

1. Carga datos históricos (5,432 registros)
2. Realiza ingeniería de características
3. Divide datos (80% train, 20% test)
4. Normaliza con StandardScaler
5. Entrena con GridSearchCV
6. Evalúa con métricas (accuracy, precision, recall, ROC-AUC)
7. Genera explicaciones SHAP
8. Guarda modelos (.pkl)

## Uso de la API

### Iniciar servicio

```bash
# Desarrollo
uvicorn main:app --reload --port 8002

# Docker
docker build -t ml-service .
docker run -p 8002:8002 ml-service
```

### Endpoints

**POST /evaluar**

```json
{
  "postulacion_id": "uuid",
  "tipo_evaluacion": "DEPENDENCIA_70_30",
  "ponderaciones": {"socioeconomico": 70, "academico": 30},
  "formulario_socioeconomico": {...},
  "formulario_academico": {...}
}
```

**Respuesta:**

```json
{
  "puntaje_socioeconomico": 65.5,
  "puntaje_academico": 28.0,
  "puntaje_total": 78.85,
  "recomendacion": "APROBADO",
  "confianza": 92.3,
  "shap_values": {...},
  "features_importantes": [
    {
      "feature": "ingreso_per_capita",
      "nombre": "Ingreso per cápita",
      "valor_shap": -0.234,
      "impacto": "Negativo"
    }
  ],
  "modelo_version": "v1.2-production",
  "metadata": {...}
}
```

**GET /metrics**

```json
{
  "modelo_dependencia": {
    "accuracy": 0.89,
    "precision": 0.87,
    "recall": 0.85,
    "f1_score": 0.86
  },
  "training_samples": 5432,
  "last_trained": "2025-11-15T10:30:00"
}
```

## Explicabilidad con SHAP

SHAP (SHapley Additive exPlanations) proporciona transparencia en las decisiones:

- **Valores SHAP**: Miden el impacto de cada característica en la predicción
- **Gráficos de importancia**: Visualizan features más influyentes
- **Interpretabilidad**: Cada decisión es explicable y auditable

## Integración con Backend Principal

```python
# Django backend llama al ML service
import requests

response = requests.post(
    "http://ml-service:8002/evaluar",
    json=data_evaluacion,
    timeout=30
)

resultado = response.json()
```

## Mejoras Futuras

- [ ] Reentrenamiento automático con nuevos datos
- [ ] A/B testing de modelos
- [ ] Monitoreo de drift del modelo
- [ ] API de batch prediction
- [ ] Caché de predicciones
- [ ] Métricas en Prometheus

## Autor

Sistema de Gestión de Becas - UAGRM
Versión: 1.0.0
