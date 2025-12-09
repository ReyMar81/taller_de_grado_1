'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import { ArrowBack as BackIcon, School as SchoolIcon } from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Convocatoria {
  id: string;
  titulo: string;
  descripcion: string;
  gestion: string;
}

interface TipoBeca {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  monto_mensual: number;
  duracion_meses: number;
}

interface Cupo {
  id: string;
  tipo_beca: string;  // ID del tipo de beca
  tipo_beca_detalle: TipoBeca;  // Objeto completo del tipo de beca
  facultad: string;
  cantidad: number;
  cupos_disponibles: number;
}

export default function NuevaPostulacionPage() {
  const router = useRouter();
  const params = useParams();
  const { token, user } = useAuthStore();
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  const [cupos, setCupos] = useState<Cupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!token) {
        router.push('/login');
        return;
      }

      const convResponse = await fetch(
        `http://localhost:8000/api/convocatorias/${params.convocatoriaId}/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!convResponse.ok) throw new Error('Error al cargar convocatoria');
      const convData = await convResponse.json();
      setConvocatoria(convData);

      const cuposResponse = await fetch(
        `http://localhost:8000/api/convocatorias/${params.convocatoriaId}/cupos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!cuposResponse.ok) throw new Error('Error al cargar cupos');
      const cuposData = await cuposResponse.json();
      
      console.log('=== DEBUG CUPOS ===');
      console.log('Total cupos recibidos:', cuposData.length);
      console.log('Facultad del estudiante:', user?.perfil_estudiante?.facultad);
      console.log('Cupos completos:', JSON.stringify(cuposData, null, 2));
      
      const cuposDisponibles = cuposData.filter((cupo: Cupo) => {
        const esParaTodasLasFacultades = cupo.facultad === 'TODAS';
        const esDeMiFacultad = user?.perfil_estudiante?.facultad === cupo.facultad;
        const hayCupos = cupo.cupos_disponibles > 0;
        
        console.log(`Cupo ${cupo.tipo_beca_detalle?.nombre || 'sin nombre'}:`, {
          facultad: cupo.facultad,
          esParaTodasLasFacultades,
          esDeMiFacultad,
          hayCupos,
          cupos_disponibles: cupo.cupos_disponibles,
          pasa_filtro: (esParaTodasLasFacultades || esDeMiFacultad) && hayCupos
        });
        
        return (esParaTodasLasFacultades || esDeMiFacultad) && hayCupos;
      });
      
      console.log('Cupos disponibles después del filtro:', cuposDisponibles.length);
      setCupos(cuposDisponibles);

      if (cuposDisponibles.length === 0) {
        setError('No hay cupos disponibles para tu facultad en esta convocatoria.');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearPostulacion = async (cupo: Cupo) => {
    try {
      setCreando(true);
      setError('');

      const response = await fetch('http://localhost:8000/api/postulaciones/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          convocatoria: params.convocatoriaId,
          tipo_beca_solicitada: cupo.tipo_beca,  // Usar el ID, no el objeto
          estado: 'BORRADOR'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Si ya existe una postulación, redirigir a Mis Postulaciones
        if (response.status === 400 && errorData.non_field_errors) {
          const errorMsg = errorData.non_field_errors[0];
          if (errorMsg.includes('Ya tiene una postulación')) {
            setError('Ya tienes una postulación para esta convocatoria. Redirigiendo a Mis Postulaciones...');
            
            setTimeout(() => {
              router.push('/estudiante/postulaciones');
            }, 1500);
            return;
          }
        }
        
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }

      const postulacion = await response.json();
      router.push(`/estudiante/postulaciones/${postulacion.id}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear postulación');
    } finally {
      setCreando(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!convocatoria) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Convocatoria no encontrada</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #C62828 0%, #8E0000 50%, #003D82 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Button
              startIcon={<BackIcon />}
              onClick={() => router.push('/estudiante/convocatorias')}
              sx={{ mb: 2 }}
            >
              Volver a Convocatorias
            </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Iniciar Postulación
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {convocatoria.titulo}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión: {convocatoria.gestion}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Selecciona el tipo de beca a la que deseas postular
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Becas disponibles para tu facultad ({user?.perfil_estudiante?.facultad}) o para todas las facultades
          </Typography>
        </Box>

        {cupos.length === 0 ? (
          <Alert severity="info">
            No hay cupos disponibles para tu facultad en esta convocatoria.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {cupos.map((cupo) => (
              <Grid item xs={12} md={6} key={cupo.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <SchoolIcon color="primary" sx={{ fontSize: 40 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {cupo.tipo_beca_detalle.nombre}
                        </Typography>
                        <Chip 
                          label={cupo.tipo_beca_detalle.codigo} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {cupo.tipo_beca_detalle.descripcion}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Monto mensual
                          </Typography>
                          <Typography variant="h6" color="primary">
                            Bs. {cupo.tipo_beca_detalle.monto_mensual}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary">
                            Duración
                          </Typography>
                          <Typography variant="h6">
                            {cupo.tipo_beca_detalle.duracion_meses} meses
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`${cupo.cupos_disponibles} cupos disponibles`}
                        size="small"
                        color={cupo.cupos_disponibles > 5 ? 'success' : 'warning'}
                        sx={{ mr: 1 }}
                      />
                      <Chip 
                        label={cupo.facultad === 'TODAS' ? 'Todas las facultades' : cupo.facultad}
                        size="small"
                        color={cupo.facultad === 'TODAS' ? 'info' : 'default'}
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleCrearPostulacion(cupo)}
                      disabled={creando || cupo.cupos_disponibles === 0}
                    >
                      {creando ? <CircularProgress size={24} /> : 'Postular a esta beca'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
          )}
        </Paper>
      </Container>
    </Box>
  );
}