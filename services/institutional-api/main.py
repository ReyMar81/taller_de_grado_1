"""
Servicio FastAPI Simulado - API Institucional UAGRM
Simula el endpoint de datos institucionales de estudiantes
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

app = FastAPI(
    title="API Institucional UAGRM (Simulado)",
    description="Endpoint simulado para datos de estudiantes",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EstudianteData(BaseModel):
    nombre: str
    ci: str
    lugar_ci: str
    activo: str
    sexo: str
    fecha_nac: str
    direccion: str
    telefono: str
    tel_celular: str
    carr: str
    plan: str
    des_carrera: str
    facultad: str


class ApiResponse(BaseModel):
    type: str
    data: Optional[EstudianteData] = None
    message: Optional[str] = None


# Base de datos simulada de estudiantes
ESTUDIANTES_DB = {
    # Estudiantes de prueba para el sistema
    "220234001": {
        "nombre": "MARÍA GARCÍA POSTULANTE",
        "ci": "11223344",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "F",
        "fecha_nac": "2002-03-15",
        "direccion": "AV. SANTOS DUMONT #234",
        "telefono": "3-334455",
        "tel_celular": "70123456",
        "carr": "101",
        "plan": "0",
        "des_carrera": "INGENIERÍA DE SISTEMAS",
        "facultad": "POLITÉCNICA"
    },
    "220345002": {
        "nombre": "JUAN PÉREZ BECADO",
        "ci": "11334455",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "M",
        "fecha_nac": "2001-07-22",
        "direccion": "B/EQUIPETROL C/LAS PALMAS #567",
        "telefono": "3-445566",
        "tel_celular": "71234567",
        "carr": "101",
        "plan": "0",
        "des_carrera": "INGENIERÍA DE SISTEMAS",
        "facultad": "POLITÉCNICA"
    },
    "223450003": {
        "nombre": "ANA MARTÍNEZ POSTULANTE",
        "ci": "11445566",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "F",
        "fecha_nac": "2003-01-10",
        "direccion": "Z.NORTE AV.BANZER KM 9",
        "telefono": "3-556677",
        "tel_celular": "72345678",
        "carr": "162",
        "plan": "0",
        "des_carrera": "OFIMÁTICA",
        "facultad": "POLITÉCNICA"
    },
    "224530004": {
        "nombre": "CARLOS RODRÍGUEZ LÓPEZ",
        "ci": "11556677",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "M",
        "fecha_nac": "2002-11-05",
        "direccion": "B/LA MORITA C/JUNÍN #890",
        "telefono": "3-667788",
        "tel_celular": "73456789",
        "carr": "201",
        "plan": "0",
        "des_carrera": "DERECHO",
        "facultad": "CIENCIAS JURÍDICAS Y POLÍTICAS"
    },
    "2203434005": {
        "nombre": "LAURA FERNÁNDEZ CRUZ",
        "ci": "11667788",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "F",
        "fecha_nac": "2003-04-18",
        "direccion": "AV.CRISTÓBAL DE MENDOZA #345",
        "telefono": "3-778899",
        "tel_celular": "74567890",
        "carr": "301",
        "plan": "0",
        "des_carrera": "MEDICINA",
        "facultad": "CIENCIAS DE LA SALUD"
    },
    "122343456": {
        "nombre": "MANRRIQUE YOPIE XIMENA",
        "ci": "11371437",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "F",
        "fecha_nac": "2003-08-18",
        "direccion": "Z.LOS CHACOS B/16 DE JULIO",
        "telefono": "73134464",
        "tel_celular": "73134464",
        "carr": "162",
        "plan": "0",
        "des_carrera": "OFIMÁTICA",
        "facultad": "POLITÉCNICA"
    },
        # Caso del ejemplo original
    "216027438": {
        "nombre": "REYMAR LOAIZA LABARDEN",
        "ci": "11340863",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "M",
        "fecha_nac": "1997-12-28",
        "direccion": "Z.LOS CHACOS B/16 DE JULIO",
        "telefono": "78544572",
        "tel_celular": "78544572",
        "carr": "187",
        "plan": "4",
        "des_carrera": "ING. EN SISTEMAS",
        "facultad": "FICCT"
    },
            # Caso del ejemplo original
    "221090436": {
        "nombre": "Carlos Diego Marca Peñaranda",
        "ci": "12632281",
        "lugar_ci": "SCZ",
        "activo": "1",
        "sexo": "M",
        "fecha_nac": "2002-06-17",
        "direccion": "Final Cumavi",
        "telefono": "69066140",
        "tel_celular": "69066140",
        "carr": "187",
        "plan": "4",
        "des_carrera": "ING. EN SISTEMAS",
        "facultad": "FICCT"
    },
    # Ejemplo de cómo agregar más estudiantes:
    # "220006222": {
    #     "nombre": "TU NOMBRE COMPLETO",
    #     "ci": "12345678",
    #     "lugar_ci": "SCZ",
    #     "activo": "1",
    #     "sexo": "M",  # o "F"
    #     "fecha_nac": "2000-01-01",
    #     "direccion": "TU DIRECCIÓN",
    #     "telefono": "3-123456",
    #     "tel_celular": "70000000",
    #     "carr": "101",  # Código de carrera
    #     "plan": "0",
    #     "des_carrera": "TU CARRERA",
    #     "facultad": "TU FACULTAD"
    # }
}


@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "service": "API Institucional UAGRM (Simulado)",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "estudiante": "/datos/estudiante/{registro}"
        }
    }


@app.get("/datos/estudiante/{registro}", response_model=ApiResponse)
async def obtener_estudiante(registro: str):
    """
    Obtiene los datos de un estudiante por su registro universitario
    
    Args:
        registro: Registro universitario del estudiante
        
    Returns:
        Datos del estudiante si existe, error 404 si no existe
    """
    # Buscar estudiante en la base de datos simulada
    estudiante = ESTUDIANTES_DB.get(registro)
    
    if not estudiante:
        raise HTTPException(
            status_code=404,
            detail={
                "type": "error",
                "message": f"Estudiante con registro {registro} no encontrado"
            }
        )
    
    return ApiResponse(
        type="success",
        data=EstudianteData(**estudiante)
    )


@app.get("/health")
async def health_check():
    """Health check del servicio"""
    return {
        "status": "healthy",
        "service": "institutional-api",
        "estudiantes_disponibles": len(ESTUDIANTES_DB)
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
