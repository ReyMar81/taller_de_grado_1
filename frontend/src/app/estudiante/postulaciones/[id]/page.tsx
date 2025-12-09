'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  Alert,
  Chip,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Save as SaveIcon,
  Send as SendIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Postulacion {
  id: string;
  convocatoria_titulo: string;
  tipo_beca_nombre: string;
  estado: string;
  estado_display: string;
  puede_editar: boolean;
  puede_enviar: boolean;
}

interface FormularioSocioeconomico {
  numero_miembros_familia: number;
  numero_dependientes: number;
  ingreso_familiar_mensual: number;
  gasto_vivienda_mensual: number;
  gasto_alimentacion_mensual: number;
  gasto_educacion_mensual: number;
  gasto_salud_mensual: number;
  otros_gastos_mensual: number;
  tipo_vivienda: string;
  tiene_discapacidad: boolean;
  es_madre_soltera: boolean;
  es_padre_soltero: boolean;
  proviene_area_rural: boolean;
  observaciones_adicionales: string;
}

interface FormularioAcademico {
  promedio_general: number;
  semestre_actual: number;
  materias_aprobadas: number;
  materias_reprobadas: number;
  participa_actividades_universitarias: boolean;
  descripcion_actividades: string;
  participa_proyectos_investigacion: boolean;
  descripcion_investigacion: string;
  tiene_reconocimientos_academicos: boolean;
  descripcion_reconocimientos: string;
}

interface Requisito {
  id: string;
  nombre: string;
  descripcion: string;
  es_obligatorio: boolean;
  tipo_documento_esperado: string;
}

interface DocumentoPostulacion {
  id: string;
  requisito: string;
  requisito_nombre: string;
  archivo: string;
  nombre_archivo: string;
  estado: string;
  estado_display: string;
  version: number;
  fecha_subida: string;
  hash: string;
}

interface RequisitoConDocumento {
  requisito: Requisito;
  documento: DocumentoPostulacion | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function EditarPostulacionPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const [postulacion, setPostulacion] = useState<Postulacion | null>(null);
  const [documentosRequeridos, setDocumentosRequeridos] = useState<RequisitoConDocumento[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  const [formularioSocio, setFormularioSocio] = useState<FormularioSocioeconomico>({
    numero_miembros_familia: 1,
    numero_dependientes: 0,
    ingreso_familiar_mensual: 0,
    gasto_vivienda_mensual: 0,
    gasto_alimentacion_mensual: 0,
    gasto_educacion_mensual: 0,
    gasto_salud_mensual: 0,
    otros_gastos_mensual: 0,
    tipo_vivienda: 'PROPIA',
    tiene_discapacidad: false,
    es_madre_soltera: false,
    es_padre_soltero: false,
    proviene_area_rural: false,
    observaciones_adicionales: ''
  });
  
  const [formularioAcad, setFormularioAcad] = useState<FormularioAcademico>({
    promedio_general: 0,
    semestre_actual: 1,
    materias_aprobadas: 0,
    materias_reprobadas: 0,
    participa_actividades_universitarias: false,
    descripcion_actividades: '',
    participa_proyectos_investigacion: false,
    descripcion_investigacion: '',
    tiene_reconocimientos_academicos: false,
    descripcion_reconocimientos: ''
  });

  useEffect(() => {
    fetchPostulacion();
    fetchDocumentosRequeridos();
  }, []);

  const fetchPostulacion = async () => {
    try {
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/postulaciones/${params.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar postulación');

      const data = await response.json();
      setPostulacion(data);

      // Cargar formulario socioeconómico si existe
      if (data.formulario_socioeconomico) {
        setFormularioSocio(data.formulario_socioeconomico);
      }

      // Cargar formulario académico si existe
      if (data.formulario_academico) {
        setFormularioAcad(data.formulario_academico);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentosRequeridos = async () => {
    try {
      if (!token) return;

      const response = await fetch(`http://localhost:8000/api/postulaciones/${params.id}/documentos_requeridos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar documentos requeridos');

      const data = await response.json();
      setDocumentosRequeridos(data);
    } catch (err) {
      console.error('Error al cargar documentos:', err);
    }
  };

  const handleUploadDocument = async (requisitoId: string, file: File) => {
    try {
      setUploadingDoc(requisitoId);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('requisito', requisitoId);
      formData.append('archivo', file);

      const response = await fetch(`http://localhost:8000/api/postulaciones/${params.id}/subir_documento/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al subir documento');
      }

      setSuccess(`Documento "${file.name}" subido exitosamente`);
      await fetchDocumentosRequeridos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir documento');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleEnviarPostulacion = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      setConfirmDialogOpen(false);

      const response = await fetch(`http://localhost:8000/api/postulaciones/${params.id}/enviar/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.detail || 'Error al enviar postulación');
      }

      setSuccess('¡Postulación enviada exitosamente! Será evaluada próximamente.');
      await fetchPostulacion();
      
      // Redirigir a lista de postulaciones después de 2 segundos
      setTimeout(() => {
        router.push('/estudiante/postulaciones');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar postulación');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarFormularioSocio = async () => {
    try {
      setError('');
      setSuccess('');

      const method = postulacion?.formulario_socioeconomico ? 'PUT' : 'POST';
      const url = postulacion?.formulario_socioeconomico
        ? `http://localhost:8000/api/formularios-socioeconomicos/${postulacion.formulario_socioeconomico.id}/`
        : `http://localhost:8000/api/formularios-socioeconomicos/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formularioSocio,
          postulacion: params.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setSuccess('Formulario socioeconómico guardado exitosamente');
      fetchPostulacion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar formulario');
    }
  };

  const handleGuardarFormularioAcad = async () => {
    try {
      setError('');
      setSuccess('');

      const method = postulacion?.formulario_academico ? 'PUT' : 'POST';
      const url = postulacion?.formulario_academico
        ? `http://localhost:8000/api/formularios-academicos/${postulacion.formulario_academico.id}/`
        : `http://localhost:8000/api/formularios-academicos/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formularioAcad,
          postulacion: params.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      setSuccess('Formulario académico guardado exitosamente');
      fetchPostulacion();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar formulario');
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!postulacion) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Postulación no encontrada</Alert>
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
              onClick={() => router.push('/estudiante/postulaciones')}
              sx={{ mb: 2 }}
            >
              Volver
            </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Typography variant="h4" component="h1">
                {postulacion.puede_editar ? 'Editar' : 'Ver'} Postulación
              </Typography>
              <Typography variant="h6" color="text.secondary">
                {postulacion.convocatoria_titulo}
              </Typography>
            </div>
            <Chip label={postulacion.estado_display} color="primary" />
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Formulario Socioeconómico" />
          <Tab label="Formulario Académico" />
          <Tab label="Documentos" />
        </Tabs>

        {/* Tab 0: Formulario Socioeconómico */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Formulario Socioeconómico (70 puntos)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Número de miembros de la familia"
                value={formularioSocio.numero_miembros_familia}
                onChange={(e) => setFormularioSocio({...formularioSocio, numero_miembros_familia: parseInt(e.target.value) || 1})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Número de dependientes"
                value={formularioSocio.numero_dependientes}
                onChange={(e) => setFormularioSocio({...formularioSocio, numero_dependientes: parseInt(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Ingreso familiar mensual (Bs.)"
                value={formularioSocio.ingreso_familiar_mensual}
                onChange={(e) => setFormularioSocio({...formularioSocio, ingreso_familiar_mensual: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Gasto en vivienda mensual (Bs.)"
                value={formularioSocio.gasto_vivienda_mensual}
                onChange={(e) => setFormularioSocio({...formularioSocio, gasto_vivienda_mensual: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Gasto en alimentación mensual (Bs.)"
                value={formularioSocio.gasto_alimentacion_mensual}
                onChange={(e) => setFormularioSocio({...formularioSocio, gasto_alimentacion_mensual: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Gasto en educación mensual (Bs.)"
                value={formularioSocio.gasto_educacion_mensual}
                onChange={(e) => setFormularioSocio({...formularioSocio, gasto_educacion_mensual: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Gasto en salud mensual (Bs.)"
                value={formularioSocio.gasto_salud_mensual}
                onChange={(e) => setFormularioSocio({...formularioSocio, gasto_salud_mensual: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Otros gastos mensuales (Bs.)"
                value={formularioSocio.otros_gastos_mensual}
                onChange={(e) => setFormularioSocio({...formularioSocio, otros_gastos_mensual: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Tipo de vivienda</InputLabel>
                <Select
                  value={formularioSocio.tipo_vivienda}
                  onChange={(e) => setFormularioSocio({...formularioSocio, tipo_vivienda: e.target.value})}
                  label="Tipo de vivienda"
                  disabled={!postulacion.puede_editar}
                >
                  <MenuItem value="PROPIA">Propia</MenuItem>
                  <MenuItem value="ALQUILADA">Alquilada</MenuItem>
                  <MenuItem value="PRESTADA">Prestada</MenuItem>
                  <MenuItem value="ANTICRETICO">Anticrético</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioSocio.tiene_discapacidad}
                    onChange={(e) => setFormularioSocio({...formularioSocio, tiene_discapacidad: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Tiene discapacidad"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioSocio.es_madre_soltera}
                    onChange={(e) => setFormularioSocio({...formularioSocio, es_madre_soltera: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Madre soltera"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioSocio.es_padre_soltero}
                    onChange={(e) => setFormularioSocio({...formularioSocio, es_padre_soltero: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Padre soltero"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioSocio.proviene_area_rural}
                    onChange={(e) => setFormularioSocio({...formularioSocio, proviene_area_rural: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Proviene de área rural"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Observaciones adicionales"
                value={formularioSocio.observaciones_adicionales}
                onChange={(e) => setFormularioSocio({...formularioSocio, observaciones_adicionales: e.target.value})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
          </Grid>
          {postulacion.puede_editar && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleGuardarFormularioSocio}
              >
                Guardar Formulario Socioeconómico
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Tab 1: Formulario Académico */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Formulario Académico (30 puntos)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Promedio general"
                value={formularioAcad.promedio_general}
                onChange={(e) => setFormularioAcad({...formularioAcad, promedio_general: parseFloat(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
                inputProps={{ step: 0.01, min: 0, max: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Semestre actual"
                value={formularioAcad.semestre_actual}
                onChange={(e) => setFormularioAcad({...formularioAcad, semestre_actual: parseInt(e.target.value) || 1})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Materias aprobadas"
                value={formularioAcad.materias_aprobadas}
                onChange={(e) => setFormularioAcad({...formularioAcad, materias_aprobadas: parseInt(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Materias reprobadas"
                value={formularioAcad.materias_reprobadas}
                onChange={(e) => setFormularioAcad({...formularioAcad, materias_reprobadas: parseInt(e.target.value) || 0})}
                disabled={!postulacion.puede_editar}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioAcad.participa_actividades_universitarias}
                    onChange={(e) => setFormularioAcad({...formularioAcad, participa_actividades_universitarias: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Participa en actividades universitarias"
              />
            </Grid>
            {formularioAcad.participa_actividades_universitarias && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción de actividades"
                  value={formularioAcad.descripcion_actividades}
                  onChange={(e) => setFormularioAcad({...formularioAcad, descripcion_actividades: e.target.value})}
                  disabled={!postulacion.puede_editar}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioAcad.participa_proyectos_investigacion}
                    onChange={(e) => setFormularioAcad({...formularioAcad, participa_proyectos_investigacion: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Participa en proyectos de investigación"
              />
            </Grid>
            {formularioAcad.participa_proyectos_investigacion && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción de investigación"
                  value={formularioAcad.descripcion_investigacion}
                  onChange={(e) => setFormularioAcad({...formularioAcad, descripcion_investigacion: e.target.value})}
                  disabled={!postulacion.puede_editar}
                />
              </Grid>
            )}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formularioAcad.tiene_reconocimientos_academicos}
                    onChange={(e) => setFormularioAcad({...formularioAcad, tiene_reconocimientos_academicos: e.target.checked})}
                    disabled={!postulacion.puede_editar}
                  />
                }
                label="Tiene reconocimientos académicos"
              />
            </Grid>
            {formularioAcad.tiene_reconocimientos_academicos && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descripción de reconocimientos"
                  value={formularioAcad.descripcion_reconocimientos}
                  onChange={(e) => setFormularioAcad({...formularioAcad, descripcion_reconocimientos: e.target.value})}
                  disabled={!postulacion.puede_editar}
                />
              </Grid>
            )}
          </Grid>
          {postulacion.puede_editar && (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleGuardarFormularioAcad}
              >
                Guardar Formulario Académico
              </Button>
            </Box>
          )}
        </TabPanel>

        {/* Tab 2: Documentos */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Documentos Requeridos
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Sube todos los documentos obligatorios marcados con *. Los archivos deben estar en formato PDF o imagen (JPG, PNG).
          </Alert>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Documento</strong></TableCell>
                  <TableCell><strong>Descripción</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentosRequeridos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography color="text.secondary">
                        No hay documentos requeridos para esta convocatoria
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documentosRequeridos.map((item) => (
                    <TableRow key={item.requisito.id}>
                      <TableCell>
                        {item.requisito.nombre}
                        {item.requisito.es_obligatorio && (
                          <Chip label="Obligatorio" size="small" color="error" sx={{ ml: 1 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {item.requisito.descripcion}
                        </Typography>
                        {item.requisito.tipo_documento_esperado && (
                          <Typography variant="caption" color="text.secondary">
                            Tipo: {item.requisito.tipo_documento_esperado}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.documento ? (
                          <Box>
                            <Chip
                              label={item.documento.estado_display}
                              size="small"
                              color={
                                item.documento.estado === 'APROBADO' ? 'success' :
                                item.documento.estado === 'RECHAZADO' ? 'error' : 'default'
                              }
                            />
                            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                              {item.documento.nombre_archivo}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Versión {item.documento.version} - {new Date(item.documento.fecha_subida).toLocaleDateString()}
                            </Typography>
                          </Box>
                        ) : (
                          <Chip label="Pendiente" size="small" color="warning" />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {postulacion?.puede_editar && (
                          <Box>
                            <input
                              accept="application/pdf,image/jpeg,image/png,image/jpg"
                              style={{ display: 'none' }}
                              id={`upload-${item.requisito.id}`}
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleUploadDocument(item.requisito.id, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                            <label htmlFor={`upload-${item.requisito.id}`}>
                              <Button
                                variant="contained"
                                component="span"
                                size="small"
                                startIcon={uploadingDoc === item.requisito.id ? <CircularProgress size={16} /> : <UploadIcon />}
                                disabled={uploadingDoc === item.requisito.id}
                              >
                                {item.documento ? 'Reemplazar' : 'Subir'}
                              </Button>
                            </label>
                            {item.documento && (
                              <Button
                                size="small"
                                href={`http://localhost:8000${item.documento.archivo}`}
                                target="_blank"
                                sx={{ ml: 1 }}
                              >
                                Ver
                              </Button>
                            )}
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Botón Enviar */}
        {postulacion.puede_editar && postulacion.puede_enviar && (
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={() => setConfirmDialogOpen(true)}
            >
              Enviar Postulación
            </Button>
            <Alert severity="success" sx={{ flexGrow: 1 }}>
              Tu postulación está completa y lista para enviar.
            </Alert>
          </Box>
        )}

        {postulacion.puede_editar && !postulacion.puede_enviar && (
          <Alert severity="warning" sx={{ mt: 3 }}>
            Completa todos los formularios y documentos obligatorios para poder enviar tu postulación.
          </Alert>
        )}
      </Paper>

      {/* Diálogo de Confirmación */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirmar Envío de Postulación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas enviar tu postulación?
            <br /><br />
            Una vez enviada, no podrás realizar más modificaciones. Asegúrate de que:
            <ul>
              <li>Hayas completado todos los formularios</li>
              <li>Hayas subido todos los documentos obligatorios</li>
              <li>La información proporcionada sea correcta y verídica</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            onClick={handleEnviarPostulacion} 
            color="success" 
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirmar y Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
}
