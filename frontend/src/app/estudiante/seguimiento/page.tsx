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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';

interface BecaAprobada {
  id: string;
  convocatoria_titulo: string;
  tipo_beca: string;
  fecha_aprobacion: string;
  tiene_seguimientos: boolean;
  cantidad_seguimientos: number;
}

interface Seguimiento {
  id: string;
  postulacion: string;
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
  convocatoria_titulo: string;
  tipo_beca: string;
}

export default function SeguimientoBecaEstudiantePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [becasAprobadas, setBecasAprobadas] = useState<BecaAprobada[]>([]);
  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Diálogos
  const [dialogSubir, setDialogSubir] = useState(false);
  const [dialogDetalle, setDialogDetalle] = useState(false);
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<Seguimiento | null>(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    postulacion: '',
    tipo_documento: 'INFORME_ACADEMICO',
    titulo: '',
    descripcion: '',
    archivo: null as File | null,
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      // Cargar becas aprobadas
      const becasRes = await apiClient.get('/seguimientos/mis_becas_aprobadas/');
      setBecasAprobadas(Array.isArray(becasRes.data) ? becasRes.data : []);
      
      // Cargar seguimientos
      const seguimientosRes = await apiClient.get('/seguimientos/');
      setSeguimientos(Array.isArray(seguimientosRes.data) ? seguimientosRes.data : seguimientosRes.data.results || []);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos: ' + (err.response?.data?.detail || err.message));
      setBecasAprobadas([]);
      setSeguimientos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubirSeguimiento = async () => {
    if (!formData.postulacion || !formData.titulo || !formData.archivo) {
      setError('Complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const data = new FormData();
      data.append('postulacion', formData.postulacion);
      data.append('tipo_documento', formData.tipo_documento);
      data.append('titulo', formData.titulo);
      data.append('descripcion', formData.descripcion);
      data.append('documento', formData.archivo);

      await apiClient.post('/seguimientos/', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Documento de seguimiento subido correctamente');
      setDialogSubir(false);
      setFormData({
        postulacion: '',
        tipo_documento: 'INFORME_ACADEMICO',
        titulo: '',
        descripcion: '',
        archivo: null,
      });
      await cargarDatos();
    } catch (err: any) {
      setError('Error al subir seguimiento: ' + (err.response?.data?.error || err.message));
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
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>Seguimiento de Becas</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarDatos}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setDialogSubir(true)}
            disabled={becasAprobadas.length === 0}
          >
            Subir Documento
          </Button>
        </Box>
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

      {/* Resumen de becas aprobadas */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {becasAprobadas.map((beca) => (
          <Grid item xs={12} md={6} key={beca.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {beca.convocatoria_titulo}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tipo de beca: {beca.tipo_beca}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Seguimientos enviados: {beca.cantidad_seguimientos}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {becasAprobadas.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          No tienes becas aprobadas. Solo estudiantes con becas aprobadas pueden subir seguimientos.
        </Alert>
      )}

      {/* Tabla de seguimientos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Beca</strong></TableCell>
              <TableCell><strong>Título</strong></TableCell>
              <TableCell><strong>Tipo Documento</strong></TableCell>
              <TableCell><strong>Fecha Subida</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seguimientos.map((seg) => (
              <TableRow key={seg.id}>
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo Subir Documento */}
      <Dialog open={dialogSubir} onClose={() => setDialogSubir(false)} maxWidth="md" fullWidth>
        <DialogTitle>Subir Documento de Seguimiento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Beca</InputLabel>
                <Select
                  value={formData.postulacion}
                  label="Beca"
                  onChange={(e) => setFormData({ ...formData, postulacion: e.target.value })}
                >
                  {becasAprobadas.map((beca) => (
                    <MenuItem key={beca.id} value={beca.id}>
                      {beca.convocatoria_titulo} - {beca.tipo_beca}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Documento</InputLabel>
                <Select
                  value={formData.tipo_documento}
                  label="Tipo de Documento"
                  onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
                >
                  <MenuItem value="INFORME_ACADEMICO">Informe Académico</MenuItem>
                  <MenuItem value="CERTIFICADO_NOTAS">Certificado de Notas</MenuItem>
                  <MenuItem value="COMPROBANTE_PAGO">Comprobante de Pago</MenuItem>
                  <MenuItem value="OTRO">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Título"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={3}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                {formData.archivo ? formData.archivo.name : 'Seleccionar Archivo (PDF)'}
                <input
                  type="file"
                  hidden
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFormData({ ...formData, archivo: e.target.files[0] });
                    }
                  }}
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogSubir(false)}>Cancelar</Button>
          <Button onClick={handleSubirSeguimiento} variant="contained" disabled={loading}>
            Subir Documento
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Detalle */}
      <Dialog open={dialogDetalle} onClose={() => setDialogDetalle(false)} maxWidth="md" fullWidth>
        <DialogTitle>Detalle del Seguimiento</DialogTitle>
        <DialogContent>
          {seguimientoSeleccionado && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2">Beca</Typography>
                <Typography>{seguimientoSeleccionado.convocatoria_titulo} - {seguimientoSeleccionado.tipo_beca}</Typography>
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
                    <Typography variant="subtitle2">Observaciones del Responsable</Typography>
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
      </Box>
    </Box>
  );
}
