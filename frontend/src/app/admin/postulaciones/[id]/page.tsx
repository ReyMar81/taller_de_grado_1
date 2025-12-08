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
  LinearProgress
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon
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
  const [dialogEvaluacionIA, setDialogEvaluacionIA] = useState(false);
  const [evaluacionIA, setEvaluacionIA] = useState<EvaluacionIA | null>(null);

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
      
      setEvaluacionIA(data.evaluacion);
      setDialogEvaluacionIA(true);
      setSuccess('Evaluación IA completada exitosamente');
      
      // Recargar postulación para actualizar estado y puntaje
      await fetchPostulacion();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar con IA');
    } finally {
      setEvaluandoIA(false);
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
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<BackIcon />}
        onClick={() => router.push('/admin/postulaciones')}
        sx={{ mb: 2 }}
      >
        Volver a Postulaciones
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
        onClose={() => setDialogEvaluacionIA(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PsychologyIcon color="primary" />
            <Typography variant="h6">Resultado Evaluación IA</Typography>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {evaluacionIA && (
            <Grid container spacing={3}>
              {/* Puntajes */}
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
                      evaluacionIA.recomendacion === 'APROBADO' ? 'success' :
                      evaluacionIA.recomendacion === 'REVISION' ? 'warning' : 'error'
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
                      {evaluacionIA.features_importantes.map((feature, idx) => (
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

              {/* Metadata */}
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Tipo de Evaluación:</strong> {evaluacionIA.tipo_evaluacion_aplicado}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Evaluado el: {new Date(evaluacionIA.fecha_evaluacion).toLocaleString()}
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogEvaluacionIA(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
