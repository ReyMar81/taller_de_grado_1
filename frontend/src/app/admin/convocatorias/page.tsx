'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  PlayArrow as PublishIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as CloseIcon,
  Stop as StopIcon,
  CheckCircle as FinalizeIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Convocatoria {
  id: number;
  titulo: string;
  gestion: number;
  periodo: number;
  estado: string;
  estado_display: string;
  fecha_inicio: string;
  fecha_cierre: string;
  fecha_publicacion: string;
  total_cupos: number;
  tipos_beca: string[];
  esta_activa: boolean;
  puede_editar: boolean;
  creado_por?: {
    id: number;
    nombre: string;
    correo: string;
  } | null;
}

const estadoColors: Record<string, 'default' | 'primary' | 'warning' | 'error' | 'success'> = {
  BORRADOR: 'default',
  PUBLICADA: 'primary',
  PAUSADA: 'warning',
  CERRADA: 'error',
  FINALIZADA: 'success'
};

export default function ConvocatoriasAdminPage() {
  const router = useRouter();
  const { isAuthenticated, user, token } = useAuthStore();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cambiarEstadoDialog, setCambiarEstadoDialog] = useState<{
    open: boolean;
    convocatoria: Convocatoria | null;
    nuevoEstado: string;
  }>({ open: false, convocatoria: null, nuevoEstado: '' });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Verificar rol
    if (user?.rol !== 'DIRECTOR' && user?.rol !== 'ANALISTA') {
      router.push('/dashboard');
      return;
    }

    // Solo cargar convocatorias si hay token disponible
    if (token) {
      fetchConvocatorias();
    }
  }, [isAuthenticated, user, token, router]);

  const fetchConvocatorias = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar que haya token antes de hacer la petición
      if (!token) {
        console.error('No hay token disponible');
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch('http://localhost:8000/api/convocatorias/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar convocatorias');
      }

      const data = await response.json();
      console.log('Datos recibidos:', data);
      
      // DRF devuelve un objeto paginado: { count, next, previous, results }
      const convocatoriasArray = Array.isArray(data) ? data : (data.results || []);
      console.log('Convocatorias procesadas:', convocatoriasArray);
      setConvocatorias(convocatoriasArray);
    } catch (err) {
      console.error('Error en fetchConvocatorias:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar convocatorias');
      setConvocatorias([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async () => {
    if (!cambiarEstadoDialog.convocatoria || !cambiarEstadoDialog.nuevoEstado) return;

    try {
      const response = await fetch(
        `http://localhost:8000/api/convocatorias/${cambiarEstadoDialog.convocatoria.id}/cambiar_estado/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ estado: cambiarEstadoDialog.nuevoEstado })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.estado?.[0] || errorData.non_field_errors?.[0] || 'Error al cambiar estado');
      }

      setCambiarEstadoDialog({ open: false, convocatoria: null, nuevoEstado: '' });
      fetchConvocatorias();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const abrirDialogoCambiarEstado = (convocatoria: Convocatoria, nuevoEstado: string) => {
    setCambiarEstadoDialog({ open: true, convocatoria, nuevoEstado });
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Gestión de Convocatorias
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/convocatorias/crear')}
        >
          Nueva Convocatoria
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Gestión/Periodo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Cierre</TableCell>
              <TableCell>Cupos</TableCell>
              <TableCell>Creado Por</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {convocatorias.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No hay convocatorias. Crea una nueva convocatoria para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              convocatorias.map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {conv.tipos_beca && conv.tipos_beca.length > 0 
                        ? conv.tipos_beca[0] 
                        : 'Convocatoria de Becas'}
                    </Typography>
                    {conv.tipos_beca && conv.tipos_beca.length > 1 && (
                      <Typography variant="caption" color="text.secondary">
                        +{conv.tipos_beca.length - 1} tipo{conv.tipos_beca.length > 2 ? 's' : ''} más
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{conv.gestion}-{conv.periodo}</TableCell>
                  <TableCell>
                    <Chip
                      label={conv.estado_display}
                      color={estadoColors[conv.estado]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(conv.fecha_inicio).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(conv.fecha_cierre).toLocaleDateString()}</TableCell>
                  <TableCell>{conv.total_cupos}</TableCell>
                  <TableCell>{conv.creado_por?.nombre || 'N/A'}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => router.push(`/admin/convocatorias/${conv.id}`)}
                      title="Ver detalles"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => router.push(`/admin/convocatorias/${conv.id}/editar`)}
                      title="Editar convocatoria"
                      disabled={!conv.puede_editar}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>

                    {conv.estado === 'BORRADOR' && conv.total_cupos > 0 && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => abrirDialogoCambiarEstado(conv, 'PUBLICADA')}
                        title="Publicar"
                      >
                        <PublishIcon fontSize="small" />
                      </IconButton>
                    )}

                    {conv.estado === 'PUBLICADA' && (
                      <>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => abrirDialogoCambiarEstado(conv, 'PAUSADA')}
                          title="Pausar"
                        >
                          <PauseIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => abrirDialogoCambiarEstado(conv, 'CERRADA')}
                          title="Cerrar"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}

                    {conv.estado === 'PAUSADA' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => abrirDialogoCambiarEstado(conv, 'PUBLICADA')}
                        title="Reanudar"
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    )}

                    {conv.estado === 'CERRADA' && (
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => abrirDialogoCambiarEstado(conv, 'FINALIZADA')}
                        title="Finalizar"
                      >
                        <FinalizeIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo de confirmación cambio de estado */}
      <Dialog
        open={cambiarEstadoDialog.open}
        onClose={() => setCambiarEstadoDialog({ open: false, convocatoria: null, nuevoEstado: '' })}
      >
        <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro que desea cambiar el estado de la convocatoria{' '}
            <strong>{cambiarEstadoDialog.convocatoria?.titulo}</strong> a{' '}
            <strong>{cambiarEstadoDialog.nuevoEstado}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCambiarEstadoDialog({ open: false, convocatoria: null, nuevoEstado: '' })}
          >
            Cancelar
          </Button>
          <Button onClick={handleCambiarEstado} variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
