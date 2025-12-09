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
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  TextField
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Postulacion {
  id: string;
  estudiante: {
    id: string;
    nombre: string;
    correo: string;
    perfil_estudiante: {
      registro_universitario: string;
      ci?: string;
      carrera: string;
      facultad: string;
    };
  };
  convocatoria_titulo: string;
  tipo_beca_nombre: string;
  estado: string;
  estado_display: string;
  puntaje_total: number | null;
  fecha_creacion: string;
  fecha_envio: string | null;
  formulario_socioeconomico?: any;
  formulario_academico?: any;
}

interface Documento {
  id: string;
  requisito_nombre: string;
  nombre_archivo: string;
  archivo: string;
  estado: string;
  estado_display: string;
  version: number;
  fecha_subida: string;
}

interface EvaluacionIA {
  id: string;
  puntaje_socioeconomico: number;
  puntaje_academico: number;
  puntaje_total: number;
  recomendacion: string;
  confianza: number;
  features_importantes: Array<{
    feature: string;
    nombre: string;
    valor_shap: number;
    impacto: string;
  }>;
  tipo_evaluacion_aplicado: string;
  fecha_evaluacion: string;
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

export default function AdminPostulacionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [postulacion, setPostulacion] = useState<Postulacion | null>(null);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  
  // Estados para evaluación IA
  const [evaluandoIA, setEvaluandoIA] = useState(false);
  const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);
  const [dialogEvaluacionIA, setDialogEvaluacionIA] = useState(false);
  const [evaluacionIA, setEvaluacionIA] = useState<any>(null);
  
  // Estados para edición de puntajes
  const [modoEdicion, setModoEdicion] = useState(false);
  const [puntajesEditables, setPuntajesEditables] = useState({
    socioeconomico: 0,
    academico: 0,
    total: 0
  });
  const [observacionesEdicion, setObservacionesEdicion] = useState('');

  useEffect(() => {
    fetchPostulacion();
    fetchDocumentos();
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

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentos = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/postulaciones/${params.id}/documentos_requeridos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Extraer solo los documentos que han sido subidos
        const docsSubidos = data
          .filter((item: any) => item.documento !== null)
          .map((item: any) => item.documento);
        setDocumentos(docsSubidos);
      }
    } catch (err) {
      console.error('Error al cargar documentos:', err);
    }
  };

  const handleEvaluarIA = async () => {
    if (!postulacion) return;

    // Validar que esté en estado RECEPCIONADO
    if (postulacion.estado !== 'RECEPCIONADO') {
      setError('Solo se pueden evaluar postulaciones en estado RECEPCIONADO');
      return;
    }

    try {
      setEvaluandoIA(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        `http://localhost:8000/api/postulaciones/${params.id}/evaluar_ia/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al evaluar con IA');
      }

      const data = await response.json();
      
      // Guardar resultados en estado (PREVIEW - no guardado)
      setEvaluacionIA(data.resultados);
      setPuntajesEditables({
        socioeconomico: data.resultados.puntaje_socioeconomico,
        academico: data.resultados.puntaje_academico,
        total: data.resultados.puntaje_total
      });
      setDialogEvaluacionIA(true);
      setModoEdicion(false);
      setObservacionesEdicion('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar con IA');
    } finally {
      setEvaluandoIA(false);
    }
  };

  const handleAceptarEvaluacion = async () => {
    if (!evaluacionIA) return;

    try {
      setGuardandoEvaluacion(true);
      setError('');

      const response = await fetch(
        `http://localhost:8000/api/postulaciones/${params.id}/guardar_evaluacion_ia/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            puntaje_socioeconomico: evaluacionIA.puntaje_socioeconomico,
            puntaje_academico: evaluacionIA.puntaje_academico,
            puntaje_total: evaluacionIA.puntaje_total,
            metadata_ia: evaluacionIA
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar evaluación');
      }

      const data = await response.json();
      setSuccess('Evaluación guardada exitosamente');
      setDialogEvaluacionIA(false);
      await fetchPostulacion();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar evaluación');
    } finally {
      setGuardandoEvaluacion(false);
    }
  };

  const handleActivarEdicion = () => {
    setModoEdicion(true);
  };

  const handleGuardarEdicion = async () => {
    if (!evaluacionIA) return;
    
    // Validar observaciones si se editó
    if (!observacionesEdicion.trim()) {
      setError('Debe agregar observaciones al editar los puntajes');
      return;
    }

    try {
      setGuardandoEvaluacion(true);
      setError('');

      const response = await fetch(
        `http://localhost:8000/api/postulaciones/${params.id}/guardar_evaluacion_ia/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            puntaje_socioeconomico: puntajesEditables.socioeconomico,
            puntaje_academico: puntajesEditables.academico,
            puntaje_total: puntajesEditables.total,
            observaciones: observacionesEdicion,
            puntajes_originales: {
              socioeconomico: evaluacionIA.puntaje_socioeconomico,
              academico: evaluacionIA.puntaje_academico,
              total: evaluacionIA.puntaje_total
            },
            metadata_ia: evaluacionIA
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar evaluación');
      }

      const data = await response.json();
      setSuccess('Evaluación guardada exitosamente (editada manualmente)');
      setDialogEvaluacionIA(false);
      setModoEdicion(false);
      await fetchPostulacion();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar evaluación');
    } finally {
      setGuardandoEvaluacion(false);
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
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">No se encontró la postulación</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #C62828 0%, #8E0000 50%, #003D82 100%)', py: 4 }}>
      <Container maxWidth="lg">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/postulaciones')}
          sx={{ mb: 2, color: 'white', borderColor: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          variant="outlined"
        >
          Volver
        </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* Cabecera */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                Postulación - {postulacion.convocatoria_titulo}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Estudiante: {postulacion.estudiante.nombre} (RU: {postulacion.estudiante.perfil_estudiante.registro_universitario})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              {postulacion.estado === 'RECEPCIONADO' && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={evaluandoIA ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                  onClick={handleEvaluarIA}
                  disabled={evaluandoIA}
                >
                  {evaluandoIA ? 'Evaluando...' : 'Evaluar con IA'}
                </Button>
              )}
              <Chip
                label={postulacion.estado_display}
                color={
                  postulacion.estado === 'BECA_ASIGNADA' ? 'success' :
                  postulacion.estado === 'RECHAZADO' ? 'error' :
                  postulacion.estado === 'EVALUADA' ? 'primary' :
                  postulacion.estado === 'EN_REVISION' || postulacion.estado === 'RECEPCIONADO' ? 'warning' :
                  postulacion.estado === 'PARA_CONSEJO' ? 'info' : 'default'
                }
              />
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Tipo de Beca</Typography>
              <Typography variant="body1"><strong>{postulacion.tipo_beca_nombre}</strong></Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Facultad</Typography>
              <Typography variant="body1">{postulacion.estudiante.perfil_estudiante.facultad}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Carrera</Typography>
              <Typography variant="body1">{postulacion.estudiante.perfil_estudiante.carrera}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">Puntaje Total</Typography>
              <Typography variant="body1">
                {postulacion.puntaje_total !== null ? (
                  <strong style={{ fontSize: '1.2rem', color: '#1976d2' }}>
                    {postulacion.puntaje_total.toFixed(2)}
                  </strong>
                ) : (
                  'Sin evaluar'
                )}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{postulacion.estudiante.correo}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">CI</Typography>
              <Typography variant="body1">{postulacion.estudiante.perfil_estudiante.ci || 'No disponible'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Fecha de Creación</Typography>
              <Typography variant="body1">{new Date(postulacion.fecha_creacion).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Fecha de Envío</Typography>
              <Typography variant="body1">
                {postulacion.fecha_envio ? new Date(postulacion.fecha_envio).toLocaleString() : 'No enviada'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Formulario Socioeconómico" />
            <Tab label="Formulario Académico" />
            <Tab label="Documentos" />
          </Tabs>
        </Box>

        {/* Tab 0: Formulario Socioeconómico */}
        <TabPanel value={tabValue} index={0}>
          {postulacion.formulario_socioeconomico ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Información Familiar</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Miembros de familia</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.numero_miembros_familia}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Dependientes</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.numero_dependientes}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Ingresos y Gastos (Bs.)</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Ingreso familiar mensual</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.ingreso_familiar_mensual}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Gasto vivienda</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.gasto_vivienda_mensual}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Gasto alimentación</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.gasto_alimentacion_mensual}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Gasto educación</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.gasto_educacion_mensual}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Gasto salud</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.gasto_salud_mensual}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" color="text.secondary">Otros gastos</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.otros_gastos_mensual}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Información Adicional</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Tipo de vivienda</Typography>
                <Typography variant="body1">{postulacion.formulario_socioeconomico.tipo_vivienda}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {postulacion.formulario_socioeconomico.tiene_discapacidad && (
                    <Chip label="Tiene discapacidad" color="info" size="small" />
                  )}
                  {postulacion.formulario_socioeconomico.es_madre_soltera && (
                    <Chip label="Madre soltera" color="info" size="small" />
                  )}
                  {postulacion.formulario_socioeconomico.es_padre_soltero && (
                    <Chip label="Padre soltero" color="info" size="small" />
                  )}
                  {postulacion.formulario_socioeconomico.proviene_area_rural && (
                    <Chip label="Proviene de área rural" color="info" size="small" />
                  )}
                </Box>
              </Grid>
              {postulacion.formulario_socioeconomico.observaciones_adicionales && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Observaciones</Typography>
                  <Typography variant="body1">{postulacion.formulario_socioeconomico.observaciones_adicionales}</Typography>
                </Grid>
              )}
            </Grid>
          ) : (
            <Alert severity="warning">Formulario socioeconómico no completado</Alert>
          )}
        </TabPanel>

        {/* Tab 1: Formulario Académico */}
        <TabPanel value={tabValue} index={1}>
          {postulacion.formulario_academico ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Rendimiento Académico</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Promedio general</Typography>
                <Typography variant="h5" color="primary">{postulacion.formulario_academico.promedio_general}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Semestre actual</Typography>
                <Typography variant="body1">{postulacion.formulario_academico.semestre_actual}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Materias aprobadas</Typography>
                <Typography variant="body1">{postulacion.formulario_academico.materias_aprobadas}</Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2" color="text.secondary">Materias reprobadas</Typography>
                <Typography variant="body1">{postulacion.formulario_academico.materias_reprobadas}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Actividades Extracurriculares</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Participa en actividades universitarias</Typography>
                <Typography variant="body1">
                  {postulacion.formulario_academico.participa_actividades_universitarias ? 'Sí' : 'No'}
                </Typography>
                {postulacion.formulario_academico.descripcion_actividades && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {postulacion.formulario_academico.descripcion_actividades}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Participa en proyectos de investigación</Typography>
                <Typography variant="body1">
                  {postulacion.formulario_academico.participa_proyectos_investigacion ? 'Sí' : 'No'}
                </Typography>
                {postulacion.formulario_academico.descripcion_investigacion && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {postulacion.formulario_academico.descripcion_investigacion}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Tiene reconocimientos académicos</Typography>
                <Typography variant="body1">
                  {postulacion.formulario_academico.tiene_reconocimientos_academicos ? 'Sí' : 'No'}
                </Typography>
                {postulacion.formulario_academico.descripcion_reconocimientos && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {postulacion.formulario_academico.descripcion_reconocimientos}
                  </Typography>
                )}
              </Grid>
            </Grid>
          ) : (
            <Alert severity="warning">Formulario académico no completado</Alert>
          )}
        </TabPanel>

        {/* Tab 2: Documentos */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Documento</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Versión</strong></TableCell>
                  <TableCell><strong>Fecha de Subida</strong></TableCell>
                  <TableCell align="center"><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No hay documentos subidos</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documentos.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        {doc.requisito_nombre}
                        <Typography variant="caption" display="block" color="text.secondary">
                          {doc.nombre_archivo}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.estado_display}
                          size="small"
                          color={
                            doc.estado === 'APROBADO' ? 'success' :
                            doc.estado === 'RECHAZADO' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>v{doc.version}</TableCell>
                      <TableCell>{new Date(doc.fecha_subida).toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          href={`http://localhost:8000${doc.archivo}`}
                          target="_blank"
                        >
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Paper>

      {/* Dialog de Resultados Evaluación IA */}
      <Dialog 
        open={dialogEvaluacionIA} 
        onClose={() => !guardandoEvaluacion && setDialogEvaluacionIA(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">
              {modoEdicion ? 'Editar Puntajes de Evaluación IA' : 'Resultado Evaluación IA (Preview)'}
            </Typography>
          </Box>
          {!modoEdicion && (
            <Typography variant="caption" color="text.secondary">
              Los puntajes aún no se han guardado. Puede aceptarlos o editarlos antes de guardar.
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          {evaluacionIA && (
            <Grid container spacing={3}>
              {!modoEdicion ? (
                <>
                  {/* MODO VISTA - Sin editar */}
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.main' }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Puntaje Socioeconómico
                            </Typography>
                            <Typography variant="h4" color="primary">
                              {Number(evaluacionIA.puntaje_socioeconomico).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Puntaje Académico
                            </Typography>
                            <Typography variant="h4" color="primary">
                              {Number(evaluacionIA.puntaje_academico).toFixed(2)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Puntaje Total
                            </Typography>
                            <Typography variant="h3" color="primary.dark">
                              {Number(evaluacionIA.puntaje_total).toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Recomendación y Confianza */}
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Recomendación del Modelo:
                      </Typography>
                      <Chip
                        label={evaluacionIA.recomendacion}
                        color={
                          evaluacionIA.recomendacion === 'APROBADO' ? 'success' : 'error'
                        }
                        size="large"
                        sx={{ fontSize: '1rem', px: 2, py: 2.5 }}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Nivel de Confianza:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={Number(evaluacionIA.confianza)} 
                          sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
                        />
                        <Typography variant="h6" color="primary">
                          {Number(evaluacionIA.confianza).toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Factores Importantes (SHAP) */}
                  {evaluacionIA.features_importantes && evaluacionIA.features_importantes.length > 0 && (
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        Factores Más Importantes (SHAP Analysis)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Estos son los factores que más influyeron en la decisión del modelo:
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Factor</strong></TableCell>
                              <TableCell align="center"><strong>Valor SHAP</strong></TableCell>
                              <TableCell align="center"><strong>Impacto</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {evaluacionIA.features_importantes.map((feature: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{feature.nombre}</TableCell>
                                <TableCell align="center">
                                  <Typography
                                    color={Number(feature.valor_shap) > 0 ? 'success.main' : Number(feature.valor_shap) < 0 ? 'error.main' : 'text.secondary'}
                                    fontWeight="bold"
                                  >
                                    {Number(feature.valor_shap) > 0 ? '+' : ''}{Number(feature.valor_shap).toFixed(3)}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={feature.impacto}
                                    size="small"
                                    color={feature.impacto === 'Positivo' ? 'success' : feature.impacto === 'Negativo' ? 'error' : 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Grid>
                  )}
                </>
              ) : (
                <>
                  {/* MODO EDICIÓN */}
                  <Grid item xs={12}>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Está editando los puntajes calculados por la IA. Se guardará un registro de auditoría con los puntajes originales.
                    </Alert>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Puntaje Socioeconómico"
                      type="number"
                      value={puntajesEditables.socioeconomico}
                      onChange={(e) => {
                        const newSocio = parseFloat(e.target.value) || 0;
                        setPuntajesEditables({
                          socioeconomico: newSocio,
                          academico: puntajesEditables.academico,
                          total: newSocio + puntajesEditables.academico
                        });
                      }}
                      inputProps={{ min: 0, max: 70, step: 0.01 }}
                      helperText="Máximo 70 puntos"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Puntaje Académico"
                      type="number"
                      value={puntajesEditables.academico}
                      onChange={(e) => {
                        const newAcad = parseFloat(e.target.value) || 0;
                        setPuntajesEditables({
                          socioeconomico: puntajesEditables.socioeconomico,
                          academico: newAcad,
                          total: puntajesEditables.socioeconomico + newAcad
                        });
                      }}
                      inputProps={{ min: 0, max: 30, step: 0.01 }}
                      helperText="Máximo 30 puntos"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Puntaje Total: {puntajesEditables.total.toFixed(2)} / 100
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={puntajesEditables.total} 
                          sx={{ height: 10, borderRadius: 5 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Observaciones (requerido al editar)"
                      multiline
                      rows={4}
                      value={observacionesEdicion}
                      onChange={(e) => setObservacionesEdicion(e.target.value)}
                      required
                      placeholder="Explique por qué modificó los puntajes..."
                      helperText="Estas observaciones quedarán registradas en el historial de la evaluación"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        <strong>Puntajes originales de la IA:</strong>
                      </Typography>
                      <Typography variant="caption">
                        Socioeconómico: {Number(evaluacionIA.puntaje_socioeconomico).toFixed(2)} | 
                        Académico: {Number(evaluacionIA.puntaje_academico).toFixed(2)} | 
                        Total: {Number(evaluacionIA.puntaje_total).toFixed(2)}
                      </Typography>
                    </Alert>
                  </Grid>
                </>
              )}

              {/* Metadata */}
              {!modoEdicion && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>Tipo de Evaluación:</strong> {evaluacionIA.tipo_evaluacion_aplicado}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Modelo: {evaluacionIA.modelo_version} | Tiempo: {evaluacionIA.tiempo_procesamiento_ms}ms
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {!modoEdicion ? (
            <>
              <Button 
                onClick={() => setDialogEvaluacionIA(false)}
                disabled={guardandoEvaluacion}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleActivarEdicion} 
                variant="outlined"
                disabled={guardandoEvaluacion}
              >
                Editar Puntajes
              </Button>
              <Button 
                onClick={handleAceptarEvaluacion} 
                variant="contained"
                disabled={guardandoEvaluacion}
                startIcon={guardandoEvaluacion ? <CircularProgress size={20} /> : null}
              >
                {guardandoEvaluacion ? 'Guardando...' : 'Aceptar y Guardar'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                onClick={() => {
                  setModoEdicion(false);
                  setPuntajesEditables({
                    socioeconomico: evaluacionIA.puntaje_socioeconomico,
                    academico: evaluacionIA.puntaje_academico,
                    total: evaluacionIA.puntaje_total
                  });
                  setObservacionesEdicion('');
                }}
                disabled={guardandoEvaluacion}
              >
                Cancelar Edición
              </Button>
              <Button 
                onClick={handleGuardarEdicion} 
                variant="contained"
                disabled={!observacionesEdicion.trim() || guardandoEvaluacion}
                startIcon={guardandoEvaluacion ? <CircularProgress size={20} /> : null}
              >
                {guardandoEvaluacion ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
}
