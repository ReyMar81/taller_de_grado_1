'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Visibility as ViewIcon, Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Postulacion {
  id: string;
  convocatoria_titulo: string;
  tipo_beca_nombre: string;
  estado: string;
  estado_display: string;
  puntaje_total: number | null;
  puede_editar: boolean;
  fecha_creacion: string;
  fecha_envio: string | null;
}

export default function MisPostulacionesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPostulaciones();
  }, []);

  const fetchPostulaciones = async () => {
    try {
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('http://localhost:8000/api/postulaciones/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar postulaciones');

      const data = await response.json();
      const postulacionesArray = Array.isArray(data) ? data : (data.results || []);
      setPostulaciones(postulacionesArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar postulaciones');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-BO');
  };

  const getEstadoColor = (estado: string) => {
    const colores: Record<string, 'default' | 'warning' | 'info' | 'error' | 'success'> = {
      'BORRADOR': 'default',
      'RECEPCIONADO': 'info',
      'EN_REVISION': 'warning',
      'OBSERVADO': 'error',
      'EVALUADO': 'info',
      'APROBADO': 'success',
      'RECHAZADO': 'error'
    };
    return colores[estado] || 'default';
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
      <Container maxWidth="xl">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard')}
          sx={{ mb: 2, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          variant="outlined"
        >
          Volver
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ color: 'white', fontWeight: 700 }}>
            Mis Postulaciones
          </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/estudiante/convocatorias')}
        >
          Nueva Postulación
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {postulaciones.length === 0 ? (
        <Alert severity="info">
          No tienes postulaciones registradas. Dirígete a "Convocatorias" para postular a una beca.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Convocatoria</TableCell>
                <TableCell>Tipo de Beca</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Puntaje</TableCell>
                <TableCell>Fecha Creación</TableCell>
                <TableCell>Fecha Envío</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {postulaciones.map((postulacion) => (
                <TableRow key={postulacion.id}>
                  <TableCell>{postulacion.convocatoria_titulo}</TableCell>
                  <TableCell>{postulacion.tipo_beca_nombre}</TableCell>
                  <TableCell>
                    <Chip 
                      label={postulacion.estado_display} 
                      color={getEstadoColor(postulacion.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {postulacion.puntaje_total ? `${postulacion.puntaje_total.toFixed(2)} pts` : '-'}
                  </TableCell>
                  <TableCell>{formatDate(postulacion.fecha_creacion)}</TableCell>
                  <TableCell>{formatDate(postulacion.fecha_envio)}</TableCell>
                  <TableCell align="center">
                    {postulacion.puede_editar ? (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/estudiante/postulaciones/${postulacion.id}`)}
                      >
                        Editar
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => router.push(`/estudiante/postulaciones/${postulacion.id}`)}
                      >
                        Ver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      </Container>
    </Box>
  );
}
