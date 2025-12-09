'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';

interface Seguimiento {
  id: string;
  estudiante_nombre: string;
  estudiante_ru: string;
  convocatoria_titulo: string;
  tipo_beca: string;
  tipo_documento: string;
  tipo_documento_display: string;
  titulo: string;
  descripcion: string;
  documento: string;
  estado: string;
  estado_display: string;
  observaciones_responsable: string;
  revisado_por_nombre: string | null;
  fecha_revision: string | null;
  fecha_subida: string;
}

interface EstudianteBecado {
  id: string;
  nombre: string;
  correo: string;
  registro_universitario: string;
  becas: {
    id: string;
    convocatoria: string;
    tipo_beca: string;
    fecha_aprobacion: string;
    cantidad_seguimientos: number;
  }[];
  total_seguimientos: number;
}

export default function SeguimientoResponsablePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [estudiantes, setEstudiantes] = useState<EstudianteBecado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Diálogos
  const [dialogDetalle, setDialogDetalle] = useState(false);
  const [dialogRevisar, setDialogRevisar] = useState(false);
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<Seguimiento | null>(null);
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar seguimientos
      const seguimientosRes = await apiClient.get('/seguimientos-responsable/');
      setSeguimientos(Array.isArray(seguimientosRes.data) ? seguimientosRes.data : seguimientosRes.data.results || []);
      
      // Cargar estudiantes becados
      const estudiantesRes = await apiClient.get('/seguimientos-responsable/estudiantes_becados/');
      setEstudiantes(Array.isArray(estudiantesRes.data) ? estudiantesRes.data : []);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.detail || err.message));
      setSeguimientos([]);
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarRevisado = async () => {
    if (!seguimientoSeleccionado) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post(
        `/seguimientos-responsable/${seguimientoSeleccionado.id}/marcar_revisado/`,
        { observaciones }
      );

      setSuccess('Seguimiento marcado como revisado');
      setDialogRevisar(false);
      setObservaciones('');
      setSeguimientoSeleccionado(null);
      await cargarDatos();
    } catch (err: any) {
      setError('Error al revisar: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleMarcarObservado = async () => {
    if (!seguimientoSeleccionado || !observaciones) {
      setError('Debe proporcionar observaciones');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post(
        `/seguimientos-responsable/${seguimientoSeleccionado.id}/marcar_observado/`,
        { observaciones }
      );

      setSuccess('Seguimiento marcado como observado');
      setDialogRevisar(false);
      setObservaciones('');
      setSeguimientoSeleccionado(null);
      await cargarDatos();
    } catch (err: any) {
      setError('Error al marcar observado: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'REVISADO':
        return 'success';
      case 'OBSERVADO':
        return 'error';
      case 'PENDIENTE_REVISION':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'REVISADO':
        return <CheckCircleIcon />;
      case 'OBSERVADO':
        return <ErrorIcon />;
      case 'PENDIENTE_REVISION':
        return <PendingIcon />;
      default:
        return null;
    }
  };

  const seguimientosPendientes = seguimientos.filter(s => s.estado === 'PENDIENTE_REVISION');

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #C62828 0%, #8E0000 50%, #003D82 100%)', py: 4 }}>
      <Box sx={{ px: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/dashboard')}
          sx={{ mb: 2, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          variant="outlined"
        >
          Volver
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>Seguimiento de Becados</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={cargarDatos}
          disabled={loading}
        >
          Actualizar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Estadísticas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Seguimientos
              </Typography>
              <Typography variant="h4">{seguimientos.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'warning.light' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pendientes de Revisión
              </Typography>
              <Typography variant="h4">{seguimientosPendientes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Estudiantes Becados
              </Typography>
              <Typography variant="h4">{estudiantes.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Seguimientos" />
        <Tab label="Estudiantes Becados" />
      </Tabs>

      {/* Tab Seguimientos */}
      {tabValue === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Estudiante</strong></TableCell>
                <TableCell><strong>Beca</strong></TableCell>
                <TableCell><strong>Título</strong></TableCell>
                <TableCell><strong>Tipo Doc.</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {seguimientos.map((seg) => (
                <TableRow key={seg.id}>
                  <TableCell>
                    <Typography variant="body2">{seg.estudiante_nombre}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      RU: {seg.estudiante_ru}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{seg.convocatoria_titulo}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {seg.tipo_beca}
                    </Typography>
                  </TableCell>
                  <TableCell>{seg.titulo}</TableCell>
                  <TableCell>{seg.tipo_documento_display}</TableCell>
                  <TableCell>
                    {new Date(seg.fecha_subida).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getEstadoIcon(seg.estado)}
                      label={seg.estado_display}
                      color={getEstadoColor(seg.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Ver detalles">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSeguimientoSeleccionado(seg);
                          setDialogDetalle(true);
                        }}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                    {seg.estado === 'PENDIENTE_REVISION' && (
                      <Tooltip title="Revisar">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => {
                            setSeguimientoSeleccionado(seg);
                            setObservaciones('');
                            setDialogRevisar(true);
                          }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Tab Estudiantes */}
      {tabValue === 1 && (
        <Grid container spacing={2}>
          {estudiantes.map((estudiante) => (
            <Grid item xs={12} md={6} key={estudiante.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">{estudiante.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        RU: {estudiante.registro_universitario} | {estudiante.correo}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Becas Aprobadas ({estudiante.becas.length})
                  </Typography>
                  {estudiante.becas.map((beca) => (
                    <Box key={beca.id} sx={{ mb: 1, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
                      <Typography variant="body2">{beca.convocatoria} - {beca.tipo_beca}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Seguimientos: {beca.cantidad_seguimientos}
                      </Typography>
                    </Box>
                  ))}
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>
                    Total seguimientos: {estudiante.total_seguimientos}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo Detalle */}
      <Dialog open={dialogDetalle} onClose={() => setDialogDetalle(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del Seguimiento</DialogTitle>
        <DialogContent>
          {seguimientoSeleccionado && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Estudiante</Typography>
                <Typography>{seguimientoSeleccionado.estudiante_nombre}</Typography>
                <Typography variant="caption">RU: {seguimientoSeleccionado.estudiante_ru}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Beca</Typography>
                <Typography>{seguimientoSeleccionado.convocatoria_titulo}</Typography>
                <Typography variant="caption">{seguimientoSeleccionado.tipo_beca}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Título</Typography>
                <Typography>{seguimientoSeleccionado.titulo}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Tipo de Documento</Typography>
                <Typography>{seguimientoSeleccionado.tipo_documento_display}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Descripción</Typography>
                <Typography>{seguimientoSeleccionado.descripcion || 'Sin descripción'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Fecha de Subida</Typography>
                <Typography>{new Date(seguimientoSeleccionado.fecha_subida).toLocaleString('es-ES')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Estado</Typography>
                <Chip
                  icon={getEstadoIcon(seguimientoSeleccionado.estado)}
                  label={seguimientoSeleccionado.estado_display}
                  color={getEstadoColor(seguimientoSeleccionado.estado)}
                />
              </Grid>
              {seguimientoSeleccionado.observaciones_responsable && (
                <Grid item xs={12}>
                  <Alert severity={seguimientoSeleccionado.estado === 'OBSERVADO' ? 'error' : 'info'}>
                    <Typography variant="subtitle2">Observaciones</Typography>
                    <Typography variant="body2">{seguimientoSeleccionado.observaciones_responsable}</Typography>
                  </Alert>
                </Grid>
              )}
              {seguimientoSeleccionado.revisado_por_nombre && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Revisado por</Typography>
                  <Typography>{seguimientoSeleccionado.revisado_por_nombre}</Typography>
                </Grid>
              )}
              {seguimientoSeleccionado.fecha_revision && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2">Fecha de Revisión</Typography>
                  <Typography>{new Date(seguimientoSeleccionado.fecha_revision).toLocaleString('es-ES')}</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  fullWidth
                  href={seguimientoSeleccionado.documento}
                  target="_blank"
                  startIcon={<VisibilityIcon />}
                >
                  Ver Documento
                </Button>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogDetalle(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Revisar */}
      <Dialog open={dialogRevisar} onClose={() => setDialogRevisar(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revisar Seguimiento</DialogTitle>
        <DialogContent>
          {seguimientoSeleccionado && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Estudiante:</strong> {seguimientoSeleccionado.estudiante_nombre}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Título:</strong> {seguimientoSeleccionado.titulo}
              </Typography>
              <TextField
                fullWidth
                label="Observaciones (opcional)"
                multiline
                rows={4}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                sx={{ mt: 2 }}
                helperText="Agregue comentarios para el estudiante si es necesario"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRevisar(false)}>Cancelar</Button>
          <Button
            onClick={handleMarcarObservado}
            variant="outlined"
            color="error"
            disabled={loading || !observaciones}
          >
            Marcar Observado
          </Button>
          <Button
            onClick={handleMarcarRevisado}
            variant="contained"
            color="success"
            disabled={loading}
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
}
