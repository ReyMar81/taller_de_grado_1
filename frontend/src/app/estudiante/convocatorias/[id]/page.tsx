'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  CalendarToday as CalendarIcon,
  School as SchoolIcon,
  CheckCircle as CheckIcon
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
  fecha_publicacion_resultados: string;
  estado: string;
  esta_activa: boolean;
  total_cupos: number;
}

interface Cupo {
  id: string;
  tipo_beca_nombre: string;
  facultad: string;
  cantidad: number;
  tipo_beca_detalle: {
    nombre: string;
    descripcion: string;
    monto_mensual: number;
    duracion_meses: number;
  };
}

interface Criterio {
  id: string;
  nombre: string;
  descripcion: string;
  ponderacion: number;
  tipo_dato: string;
}

interface Requisito {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_archivo: string;
  es_obligatorio: boolean;
}

export default function DetalleConvocatoriaPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  const [cupos, setCupos] = useState<Cupo[]>([]);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (!token) {
        router.push('/login');
        return;
      }

      // Cargar convocatoria
      const convResponse = await fetch(
        `http://localhost:8000/api/convocatorias/${params.id}/`,
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

      // Cargar cupos
      const cuposResponse = await fetch(
        `http://localhost:8000/api/convocatorias/${params.id}/cupos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (cuposResponse.ok) {
        const cuposData = await cuposResponse.json();
        setCupos(Array.isArray(cuposData) ? cuposData : (cuposData.results || []));
      }

      // Cargar criterios
      const criteriosResponse = await fetch(
        `http://localhost:8000/api/convocatorias/${params.id}/criterios/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (criteriosResponse.ok) {
        const criteriosData = await criteriosResponse.json();
        setCriterios(Array.isArray(criteriosData) ? criteriosData : (criteriosData.results || []));
      }

      // Cargar requisitos
      const requisitosResponse = await fetch(
        `http://localhost:8000/api/convocatorias/${params.id}/requisitos/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (requisitosResponse.ok) {
        const requisitosData = await requisitosResponse.json();
        setRequisitos(Array.isArray(requisitosData) ? requisitosData : (requisitosData.results || []));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-BO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Convocatoria no encontrada</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #C62828 0%, #8E0000 50%, #003D82 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<BackIcon />}
          onClick={() => router.push('/estudiante/convocatorias')}
          sx={{ mb: 2, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          variant="outlined"
        >
          Volver
        </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              {convocatoria.titulo}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                label={convocatoria.esta_activa ? 'ACTIVA' : 'CERRADA'} 
                color={convocatoria.esta_activa ? 'success' : 'default'}
              />
              <Chip label={`Gestión ${convocatoria.gestion}`} variant="outlined" />
            </Box>
          </div>
          {convocatoria.esta_activa && (
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push(`/estudiante/postulaciones/nueva/${convocatoria.id}`)}
            >
              Postular Ahora
            </Button>
          )}
        </Box>

        <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
          {convocatoria.descripcion}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon color="primary" />
              <Typography variant="subtitle2" color="text.secondary">
                Inicio de Postulaciones
              </Typography>
            </Box>
            <Typography variant="body1">
              {formatDate(convocatoria.fecha_inicio)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon color="error" />
              <Typography variant="subtitle2" color="text.secondary">
                Cierre de Postulaciones
              </Typography>
            </Box>
            <Typography variant="body1" color="error.main" fontWeight="bold">
              {formatDate(convocatoria.fecha_cierre)}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CalendarIcon color="action" />
              <Typography variant="subtitle2" color="text.secondary">
                Publicación de Resultados
              </Typography>
            </Box>
            <Typography variant="body1">
              {formatDate(convocatoria.fecha_publicacion_resultados)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Cupos por Beca */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon color="primary" />
          Becas Disponibles
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Total de cupos: {convocatoria.total_cupos}
        </Typography>

        {cupos.length === 0 ? (
          <Alert severity="info">No hay cupos definidos para esta convocatoria</Alert>
        ) : (
          <Grid container spacing={2}>
            {cupos.map((cupo) => (
              <Grid item xs={12} md={6} key={cupo.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {cupo.tipo_beca_detalle.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {cupo.tipo_beca_detalle.descripcion}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Monto mensual
                        </Typography>
                        <Typography variant="h6" color="primary">
                          Bs. {cupo.tipo_beca_detalle.monto_mensual}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Duración
                        </Typography>
                        <Typography variant="h6">
                          {cupo.tipo_beca_detalle.duracion_meses} meses
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="body2" color="text.secondary">
                          Cupos {cupo.facultad}
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {cupo.cantidad}
                        </Typography>
                      </div>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Criterios de Evaluación */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Criterios de Evaluación
        </Typography>
        {criterios.length === 0 ? (
          <Alert severity="info">No hay criterios definidos</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Criterio</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Ponderación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {criterios.map((criterio) => (
                  <TableRow key={criterio.id}>
                    <TableCell>{criterio.nombre}</TableCell>
                    <TableCell>{criterio.descripcion}</TableCell>
                    <TableCell align="right">
                      <Chip label={`${criterio.ponderacion}%`} color="primary" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={2} align="right">
                    <strong>Total</strong>
                  </TableCell>
                  <TableCell align="right">
                    <Chip 
                      label={`${criterios.reduce((sum, c) => sum + c.ponderacion, 0)}%`} 
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Requisitos Documentales */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Documentos Requeridos
        </Typography>
        {requisitos.length === 0 ? (
          <Alert severity="info">No hay requisitos definidos</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Tipo de Archivo</TableCell>
                  <TableCell align="center">Obligatorio</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requisitos.map((requisito) => (
                  <TableRow key={requisito.id}>
                    <TableCell>{requisito.nombre}</TableCell>
                    <TableCell>{requisito.descripcion}</TableCell>
                    <TableCell>
                      <Chip label={requisito.tipo_archivo} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      {requisito.es_obligatorio ? (
                        <CheckIcon color="success" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">Opcional</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {convocatoria.esta_activa && (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => router.push(`/estudiante/postulaciones/nueva/${convocatoria.id}`)}
          >
            Postular a esta Convocatoria
          </Button>
        </Box>
      )}
      </Container>
    </Box>
  );
}
