'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  Event as EventIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Convocatoria {
  id: string;
  titulo: string;
  descripcion: string;
  gestion: string;
  periodo: number;
  fecha_inicio: string;
  fecha_cierre: string;
  estado: string;
  total_cupos: number;
  esta_activa: boolean;
}

export default function ConvocatoriasEstudiantePage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConvocatorias();
  }, []);

  const fetchConvocatorias = async () => {
    try {
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/convocatorias/activas/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar convocatorias');

      const data = await response.json();
      const convocatoriasArray = Array.isArray(data) ? data : (data.results || []);
      
      setConvocatorias(convocatoriasArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar convocatorias');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePostular = (convocatoriaId: string) => {
    console.log('Navegando a postular:', `/estudiante/postulaciones/nueva/${convocatoriaId}`);
    router.push(`/estudiante/postulaciones/nueva/${convocatoriaId}`);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #C62828 0%, #8E0000 50%, #003D82 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard')}
          sx={{ mb: 2, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          variant="outlined"
        >
          Volver
        </Button>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
            Convocatorias de Becas Disponibles
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          Revisa las convocatorias activas y postula a las becas disponibles
        </Typography>
      </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {convocatorias.length === 0 ? (
          <Alert severity="info">
            No hay convocatorias activas en este momento. Vuelve a revisar más tarde.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {convocatorias.map((convocatoria) => (
              <Grid item xs={12} key={convocatoria.id}>
                <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h5" component="h2">
                      {convocatoria.titulo}
                    </Typography>
                    <Chip 
                      label={convocatoria.esta_activa ? 'ACTIVA' : 'CERRADA'} 
                      color={convocatoria.esta_activa ? 'success' : 'default'}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {convocatoria.descripcion}
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SchoolIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          Gestión {convocatoria.gestion}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon color="action" fontSize="small" />
                        <Typography variant="body2">
                          {formatDate(convocatoria.fecha_inicio)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EventIcon color="action" fontSize="small" />
                        <Typography variant="body2" color="error">
                          Cierra: {formatDate(convocatoria.fecha_cierre)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {convocatoria.total_cupos > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`${convocatoria.total_cupos} cupos disponibles`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    onClick={() => handlePostular(convocatoria.id)}
                  >
                    Postular a esta convocatoria
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => router.push(`/estudiante/convocatorias/${convocatoria.id}`)}
                  >
                    Ver detalles
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
