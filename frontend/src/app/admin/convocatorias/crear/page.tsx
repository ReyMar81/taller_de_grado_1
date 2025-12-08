'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Paper,
  Grid,
  Alert,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { useAuthStore } from '@/store/authStore';

const steps = ['Información Básica', 'Cupos y Criterios', 'Requisitos'];

export default function CrearConvocatoriaPage() {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Información básica
  const [formData, setFormData] = useState({
    gestion: new Date().getFullYear(),
    periodo: 1,
    fecha_inicio: '',
    fecha_cierre: '',
    fecha_publicacion_resultados: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.rol !== 'DIRECTOR' && user?.rol !== 'ANALISTA') {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('No se pudo obtener el token de autenticación');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Generar título y descripción automáticamente
      const periodoTexto = formData.periodo === 1 ? 'Primer Semestre' : 'Segundo Semestre';
      const convocatoriaData = {
        titulo: `Convocatoria de Becas - Gestión ${formData.gestion}/${formData.periodo}`,
        descripcion: `Convocatoria oficial de Becas Institucionales para el ${periodoTexto} de ${formData.gestion}. 
        
Esta convocatoria ofrece apoyo económico, académico, alimenticio e investigativo para garantizar la continuidad y permanencia universitaria de estudiantes de pregrado de la UAGRM.

REQUISITOS GENERALES:
- Ser estudiante regular activo
- No tener sanciones disciplinarias  
- No estar recibiendo otra beca (salvo excepciones)
- Cumplir con criterios académicos y socioeconómicos

VIGENCIA: 1 semestre académico (renovable según reglamento)

Conforme a: Resolución ICU Nº 061-2024`,
        ...formData
      };

      const response = await fetch('http://localhost:8000/api/convocatorias/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(convocatoriaData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        throw new Error(errorMessages);
      }

      const data = await response.json();
      setSuccess(true);
      
      // Redirigir a la página de edición para agregar cupos, criterios y requisitos
      setTimeout(() => {
        router.push(`/admin/convocatorias/${data.id}/editar`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear convocatoria');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="success">
          ¡Convocatoria creada exitosamente! Redirigiendo para configurar cupos, criterios y requisitos...
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Nueva Convocatoria de Becas
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Define el periodo académico y las fechas. Después podrás seleccionar las becas oficiales a ofrecer y configurar cupos, criterios y requisitos.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Alert severity="info">
                El sistema generará automáticamente el título y descripción basándose en la gestión y periodo seleccionados.
              </Alert>
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Gestión (Año)"
                name="gestion"
                value={formData.gestion}
                onChange={handleChange}
                required
                inputProps={{ min: 2024, max: 2030 }}
                helperText="Año académico de la convocatoria"
              />
            </Grid>

            <Grid item xs={6}>
              <TextField
                fullWidth
                select
                label="Periodo"
                name="periodo"
                value={formData.periodo}
                onChange={handleChange}
                required
                helperText="Semestre académico"
              >
                <MenuItem value={1}>I - Primer Semestre</MenuItem>
                <MenuItem value={2}>II - Segundo Semestre</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                Fechas de la Convocatoria
              </Typography>
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Inicio"
                name="fecha_inicio"
                value={formData.fecha_inicio}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Inicio de postulaciones"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Cierre"
                name="fecha_cierre"
                value={formData.fecha_cierre}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Fin de postulaciones"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Fecha de Publicación de Resultados"
                name="fecha_publicacion_resultados"
                value={formData.fecha_publicacion_resultados}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Publicación de resultados"
              />
            </Grid>

            <Grid item xs={12}>
              <Alert severity="warning">
                La convocatoria se creará en estado <strong>BORRADOR</strong>. Deberás:
                <ul>
                  <li>Seleccionar las becas oficiales a ofrecer (de las 5 disponibles)</li>
                  <li>Configurar cupos por facultad para cada beca</li>
                  <li>Definir criterios de evaluación (70% socio + 30% académico)</li>
                  <li>Especificar requisitos documentales</li>
                </ul>
                Solo entonces podrás publicarla.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/convocatorias')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Crear Convocatoria'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
