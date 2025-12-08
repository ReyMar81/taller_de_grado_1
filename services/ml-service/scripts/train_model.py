"""
Script de Entrenamiento del Modelo ML
Tecnología: Scikit-learn 1.4.2 + SHAP 0.45.1

Este script entrena los modelos de clasificación para evaluar postulaciones
a becas usando datos históricos y genera explicaciones SHAP.
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
import joblib
import shap
import matplotlib.pyplot as plt
from datetime import datetime
import json

print("="*70)
print("ENTRENAMIENTO DE MODELOS ML - SISTEMA DE BECAS")
print("Scikit-learn 1.4.2 + SHAP 0.45.1")
print("="*70)

# ============================================================================
# 1. CARGA DE DATOS
# ============================================================================
print("\n[1/7] Cargando datos históricos...")

# Cargar datos de postulaciones históricas
df = pd.read_csv('data/postulaciones_historicas.csv')

print(f"✓ Dataset cargado: {len(df)} registros")
print(f"  - Becas aprobadas: {len(df[df['aprobado'] == 1])}")
print(f"  - Becas rechazadas: {len(df[df['aprobado'] == 0])}")

# ============================================================================
# 2. INGENIERÍA DE CARACTERÍSTICAS
# ============================================================================
print("\n[2/7] Ingeniería de características...")

# Features socioeconómicas
features_socio = [
    'numero_miembros_familia',
    'numero_dependientes',
    'ingreso_per_capita',
    'gasto_vivienda_mensual',
    'gasto_alimentacion_mensual',
    'gasto_educacion_mensual',
    'gasto_salud_mensual',
    'otros_gastos_mensual',
    'vivienda_propia',
    'tiene_discapacidad',
    'padre_madre_soltero',
    'area_rural'
]

# Features académicas
features_acad = [
    'promedio_general',
    'semestre_actual',
    'materias_aprobadas',
    'materias_reprobadas',
    'tasa_aprobacion',
    'actividades_universitarias',
    'proyectos_investigacion',
    'reconocimientos_academicos'
]

feature_names = features_socio + features_acad

# Crear feature tasa_aprobacion
df['tasa_aprobacion'] = df['materias_aprobadas'] / (df['materias_aprobadas'] + df['materias_reprobadas'])

X = df[feature_names]
y = df['aprobado']

print(f"✓ {len(feature_names)} características extraídas")

# ============================================================================
# 3. DIVISIÓN DE DATOS
# ============================================================================
print("\n[3/7] Dividiendo datos en train/test...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"✓ Train: {len(X_train)} registros")
print(f"✓ Test: {len(X_test)} registros")

# ============================================================================
# 4. NORMALIZACIÓN
# ============================================================================
print("\n[4/7] Normalizando datos...")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("✓ Datos normalizados con StandardScaler")

# ============================================================================
# 5. ENTRENAMIENTO DE MODELOS
# ============================================================================
print("\n[5/7] Entrenando modelos...")

# Modelo 1: Random Forest para DEPENDENCIA_70_30
print("\n  → Modelo DEPENDENCIA_70_30 (Random Forest)...")

param_grid_rf = {
    'n_estimators': [100, 200, 300],
    'max_depth': [10, 20, 30],
    'min_samples_split': [2, 5, 10],
    'min_samples_leaf': [1, 2, 4]
}

rf_model = RandomForestClassifier(random_state=42, n_jobs=-1)
grid_search_rf = GridSearchCV(
    rf_model, 
    param_grid_rf, 
    cv=5, 
    scoring='roc_auc',
    n_jobs=-1,
    verbose=1
)

grid_search_rf.fit(X_train_scaled, y_train)
modelo_dependencia = grid_search_rf.best_estimator_

print(f"    ✓ Mejores parámetros: {grid_search_rf.best_params_}")
print(f"    ✓ Score CV: {grid_search_rf.best_score_:.4f}")

# Modelo 2: Gradient Boosting para MERITO_100
print("\n  → Modelo MERITO_100 (Gradient Boosting)...")

param_grid_gb = {
    'n_estimators': [100, 200],
    'learning_rate': [0.01, 0.1, 0.2],
    'max_depth': [3, 5, 7]
}

gb_model = GradientBoostingClassifier(random_state=42)
grid_search_gb = GridSearchCV(
    gb_model,
    param_grid_gb,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    verbose=1
)

grid_search_gb.fit(X_train_scaled, y_train)
modelo_merito = grid_search_gb.best_estimator_

print(f"    ✓ Mejores parámetros: {grid_search_gb.best_params_}")
print(f"    ✓ Score CV: {grid_search_gb.best_score_:.4f}")

# ============================================================================
# 6. EVALUACIÓN
# ============================================================================
print("\n[6/7] Evaluando modelos...")

# Evaluación modelo DEPENDENCIA
y_pred_dep = modelo_dependencia.predict(X_test_scaled)
y_proba_dep = modelo_dependencia.predict_proba(X_test_scaled)[:, 1]

print("\n  → Modelo DEPENDENCIA_70_30:")
print(classification_report(y_test, y_pred_dep, target_names=['Rechazado', 'Aprobado']))
print(f"    ROC-AUC: {roc_auc_score(y_test, y_proba_dep):.4f}")

# Evaluación modelo MERITO
y_pred_mer = modelo_merito.predict(X_test_scaled)
y_proba_mer = modelo_merito.predict_proba(X_test_scaled)[:, 1]

print("\n  → Modelo MERITO_100:")
print(classification_report(y_test, y_pred_mer, target_names=['Rechazado', 'Aprobado']))
print(f"    ROC-AUC: {roc_auc_score(y_test, y_proba_mer):.4f}")

# ============================================================================
# 7. EXPLICABILIDAD CON SHAP
# ============================================================================
print("\n[7/7] Generando explicaciones SHAP...")

# SHAP para modelo DEPENDENCIA
explainer_dep = shap.TreeExplainer(modelo_dependencia)
shap_values_dep = explainer_dep.shap_values(X_test_scaled)

# Si es clasificación binaria, tomar clase positiva
if isinstance(shap_values_dep, list):
    shap_values_dep = shap_values_dep[1]

# Generar gráfico de importancia
plt.figure(figsize=(10, 6))
shap.summary_plot(
    shap_values_dep, 
    X_test, 
    feature_names=feature_names,
    show=False
)
plt.savefig('models/shap_importance_dependencia.png', bbox_inches='tight', dpi=300)
print("  ✓ Gráfico SHAP guardado: models/shap_importance_dependencia.png")

# SHAP para modelo MERITO
explainer_mer = shap.TreeExplainer(modelo_merito)
shap_values_mer = explainer_mer.shap_values(X_test_scaled)

if isinstance(shap_values_mer, list):
    shap_values_mer = shap_values_mer[1]

plt.figure(figsize=(10, 6))
shap.summary_plot(
    shap_values_mer,
    X_test,
    feature_names=feature_names,
    show=False
)
plt.savefig('models/shap_importance_merito.png', bbox_inches='tight', dpi=300)
print("  ✓ Gráfico SHAP guardado: models/shap_importance_merito.png")

# ============================================================================
# 8. GUARDAR MODELOS
# ============================================================================
print("\n[8/8] Guardando modelos entrenados...")

joblib.dump(modelo_dependencia, 'models/modelo_dependencia_70_30.pkl')
joblib.dump(modelo_merito, 'models/modelo_merito_100.pkl')
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(feature_names, 'models/feature_names.pkl')

print("  ✓ modelo_dependencia_70_30.pkl")
print("  ✓ modelo_merito_100.pkl")
print("  ✓ scaler.pkl")
print("  ✓ feature_names.pkl")

# Guardar metadata
metadata = {
    "fecha_entrenamiento": datetime.now().isoformat(),
    "version_modelo": "v1.2",
    "registros_entrenamiento": len(X_train),
    "registros_test": len(X_test),
    "features": feature_names,
    "metricas_dependencia": {
        "accuracy": float((y_pred_dep == y_test).mean()),
        "roc_auc": float(roc_auc_score(y_test, y_proba_dep))
    },
    "metricas_merito": {
        "accuracy": float((y_pred_mer == y_test).mean()),
        "roc_auc": float(roc_auc_score(y_test, y_proba_mer))
    },
    "tecnologias": {
        "scikit_learn": "1.4.2",
        "shap": "0.45.1"
    }
}

with open('models/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("  ✓ metadata.json")

print("\n" + "="*70)
print("ENTRENAMIENTO COMPLETADO EXITOSAMENTE")
print("="*70)
print(f"\nModelos listos para producción en: services/ml-service/models/")
print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
