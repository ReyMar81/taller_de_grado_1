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
  CircularProgress,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  IconButton,
  Tooltip,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

interface Postulacion {
  id: string;
  estudiante_nombre: string;
  estudiante_ru: string;
  estudiante_facultad: string;
  convocatoria_titulo: string;
  tipo_beca_nombre: string;
  estado: string;
  estado_display: string;
  puntaje_total: number | null;
  fecha_creacion: string;
  fecha_envio: string | null;
  tiene_evaluacion_ia: boolean;
  tiene_evaluacion_manual: boolean;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Postulacion[];
}

export default function AdminPostulacionesPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Selección múltiple y evaluación en lote
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]);
  const [evaluandoLote, setEvaluandoLote] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [dialogResultados, setDialogResultados] = useState(false);
  const [resultadosLote, setResultadosLote] = useState<any>(null);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    estado: '',
    convocatoria: '',
    facultad: '',
    busqueda: ''
  });

  const [convocatorias, setConvocatorias] = useState<Array<{id: string, titulo: string}>>([]);

  useEffect(() => {
    fetchConvocatorias();
  }, []);

  useEffect(() => {
    fetchPostulaciones();
  }, [page, rowsPerPage, filtros]);

  const fetchConvocatorias = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/convocatorias/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const convocatoriasArray = Array.isArray(data) ? data : (data.results || []);
        setConvocatorias(convocatoriasArray);
      }
    } catch (err) {
      console.error('Error al cargar convocatorias:', err);
    }
  };

  const fetchPostulaciones = async () => {
    try {
      setLoading(true);
      if (!token) {
        router.push('/login');
        return;
      }

      // Construir query params
      const params = new URLSearchParams();
      params.append('limit', rowsPerPage.toString());
      params.append('offset', (page * rowsPerPage).toString());
      
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.convocatoria) params.append('convocatoria', filtros.convocatoria);
      if (filtros.facultad) params.append('estudiante__perfil_estudiante__facultad', filtros.facultad);
      if (filtros.busqueda) params.append('search', filtros.busqueda);

      const response = await fetch(`http://localhost:8000/api/postulaciones/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar postulaciones');

      const data: PaginatedResponse = await response.json();
      setPostulaciones(data.results);
      setTotalCount(data.count);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleLimpiarFiltros = () => {
    setFiltros({
      estado: '',
      convocatoria: '',
      facultad: '',
      busqueda: ''
    });
    setPage(0);
  };

  const handleSeleccionarTodo = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const recepcionadas = postulaciones
        .filter(p => p.estado === 'RECEPCIONADO')
        .map(p => p.id);
      setSeleccionadas(recepcionadas);
    } else {
      setSeleccionadas([]);
    }
  };

  const handleSeleccionarPostulacion = (id: string) => {
    setSeleccionadas(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleEvaluarLote = async () => {
    if (!filtros.convocatoria) {
      setError('Debe seleccionar una convocatoria para evaluar en lote');
      return;
    }

    try {
      setEvaluandoLote(true);
      setError('');
      setSuccess('');

      const response = await fetch(
        'http://localhost:8000/api/postulaciones/evaluar_lote/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            convocatoria_id: filtros.convocatoria
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al evaluar en lote');
      }

      const data = await response.json();
      setResultadosLote(data);
      setDialogResultados(true);
      setSuccess(`${data.evaluadas_exitosamente} postulaciones evaluadas correctamente`);
      
      // Limpiar selección y recargar
      setSeleccionadas([]);
      await fetchPostulaciones();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al evaluar en lote');
    } finally {
      setEvaluandoLote(false);
    }
  };

  const handleExportarPDF = async () => {
    if (!filtros.convocatoria) {
      setError('Debe seleccionar una convocatoria para exportar PDF');
      return;
    }

    try {
      setExportandoPDF(true);
      setError('');

      const response = await fetch(
        'http://localhost:8000/api/postulaciones/exportar_resultados_pdf/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            convocatoria_id: filtros.convocatoria
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al exportar PDF');
      }

      // Descargar el archivo PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resultados_Evaluacion_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess('PDF exportado exitosamente');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar PDF');
    } finally {
      setExportandoPDF(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'BORRADOR': return 'default';
      case 'RECEPCIONADO': return 'info';
      case 'EN_EVALUACION': return 'warning';
      case 'EVALUADO': return 'primary';
      case 'APROBADO': return 'success';
      case 'RECHAZADO': return 'error';
      case 'OBSERVADO': return 'warning';
      default: return 'default';
    }
  };

  if (loading && postulaciones.length === 0) {
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
          Gestión de Postulaciones
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {filtros.convocatoria && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={evaluandoLote ? <CircularProgress size={20} color="inherit" /> : <PsychologyIcon />}
                onClick={handleEvaluarLote}
                disabled={evaluandoLote}
              >
                {evaluandoLote ? 'Evaluando...' : 'Evaluar Convocatoria'}
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={exportandoPDF ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
                onClick={handleExportarPDF}
                disabled={exportandoPDF}
              >
                {exportandoPDF ? 'Generando...' : 'Exportar PDF'}
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPostulaciones}
          >
            Actualizar
          </Button>
        </Box>
      </Box>

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

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Filtros</Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar (RU, Nombre)"
              value={filtros.busqueda}
              onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtros.estado}
                label="Estado"
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="BORRADOR">Borrador</MenuItem>
                <MenuItem value="RECEPCIONADO">Recepcionado</MenuItem>
                <MenuItem value="EN_EVALUACION">En Evaluación</MenuItem>
                <MenuItem value="EVALUADO">Evaluado</MenuItem>
                <MenuItem value="APROBADO">Aprobado</MenuItem>
                <MenuItem value="RECHAZADO">Rechazado</MenuItem>
                <MenuItem value="OBSERVADO">Observado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Convocatoria</InputLabel>
              <Select
                value={filtros.convocatoria}
                label="Convocatoria"
                onChange={(e) => setFiltros({ ...filtros, convocatoria: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {convocatorias.map((conv) => (
                  <MenuItem key={conv.id} value={conv.id}>{conv.titulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Facultad</InputLabel>
              <Select
                value={filtros.facultad}
                label="Facultad"
                onChange={(e) => setFiltros({ ...filtros, facultad: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="INGENIERIA">Ingeniería</MenuItem>
                <MenuItem value="CIENCIAS_EXACTAS">Ciencias Exactas</MenuItem>
                <MenuItem value="MEDICINA">Medicina</MenuItem>
                <MenuItem value="DERECHO">Derecho</MenuItem>
                <MenuItem value="ECONOMIA">Economía</MenuItem>
                <MenuItem value="HUMANIDADES">Humanidades</MenuItem>
                <MenuItem value="CIENCIAS_AGRICOLAS">Ciencias Agrícolas</MenuItem>
                <MenuItem value="ARQUITECTURA">Arquitectura</MenuItem>
                <MenuItem value="VETERINARIA">Veterinaria</MenuItem>
                <MenuItem value="FICCT">Veterinaria</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button variant="outlined" onClick={handleLimpiarFiltros}>
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla de Postulaciones */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>RU</strong></TableCell>
              <TableCell><strong>Estudiante</strong></TableCell>
              <TableCell><strong>Facultad</strong></TableCell>
              <TableCell><strong>Convocatoria</strong></TableCell>
              <TableCell><strong>Tipo Beca</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Puntaje</strong></TableCell>
              <TableCell><strong>Fecha Envío</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress size={30} />
                </TableCell>
              </TableRow>
            ) : postulaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">
                    No se encontraron postulaciones
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              postulaciones.map((postulacion) => (
                <TableRow key={postulacion.id} hover>
                  <TableCell>{postulacion.estudiante_ru}</TableCell>
                  <TableCell>{postulacion.estudiante_nombre}</TableCell>
                  <TableCell>
                    <Chip label={postulacion.estudiante_facultad} size="small" />
                  </TableCell>
                  <TableCell>{postulacion.convocatoria_titulo}</TableCell>
                  <TableCell>{postulacion.tipo_beca_nombre}</TableCell>
                  <TableCell>
                    <Chip
                      label={postulacion.estado_display}
                      color={getEstadoColor(postulacion.estado)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {postulacion.puntaje_total !== null ? (
                      <strong>{postulacion.puntaje_total.toFixed(2)}</strong>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Sin evaluar
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {postulacion.fecha_envio
                      ? new Date(postulacion.fecha_envio).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Ver Detalles">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => router.push(`/admin/postulaciones/${postulacion.id}`)}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      {/* Dialog de Resultados de Evaluación en Lote */}
      <Dialog
        open={dialogResultados}
        onClose={() => setDialogResultados(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Resultados de Evaluación en Lote
          {resultadosLote?.convocatoria && (
            <Typography variant="subtitle2" color="text.secondary">
              {resultadosLote.convocatoria.titulo} - Gestión {resultadosLote.convocatoria.gestion}-{resultadosLote.convocatoria.periodo}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {resultadosLote && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Total procesadas:</strong> {resultadosLote.total_procesadas} | 
                  <strong> Exitosas:</strong> {resultadosLote.evaluadas_exitosamente} | 
                  <strong> Errores:</strong> {resultadosLote.errores}
                </Typography>
              </Alert>

              {resultadosLote.resultados && resultadosLote.resultados.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Postulaciones Evaluadas (Ordenadas por Puntaje)
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>#</strong></TableCell>
                          <TableCell><strong>RU</strong></TableCell>
                          <TableCell><strong>Estudiante</strong></TableCell>
                          <TableCell><strong>Tipo Beca</strong></TableCell>
                          <TableCell align="center"><strong>P. Socio</strong></TableCell>
                          <TableCell align="center"><strong>P. Académico</strong></TableCell>
                          <TableCell align="center"><strong>P. Total</strong></TableCell>
                          <TableCell align="center"><strong>Recomendación</strong></TableCell>
                          <TableCell align="center"><strong>Confianza</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultadosLote.resultados.map((resultado: any) => (
                          <TableRow 
                            key={resultado.postulacion_id}
                            sx={{
                              bgcolor: 
                                resultado.ranking === 1 ? '#ffd700' :
                                resultado.ranking === 2 ? '#c0c0c0' :
                                resultado.ranking === 3 ? '#cd7f32' :
                                'inherit'
                            }}
                          >
                            <TableCell>
                              <strong>#{resultado.ranking}</strong>
                            </TableCell>
                            <TableCell>{resultado.registro_universitario}</TableCell>
                            <TableCell>{resultado.estudiante}</TableCell>
                            <TableCell>
                              <Chip label={resultado.tipo_beca} size="small" />
                            </TableCell>
                            <TableCell align="center">
                              {Number(resultado.puntaje_socioeconomico).toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              {Number(resultado.puntaje_academico).toFixed(2)}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                {Number(resultado.puntaje_total).toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={resultado.recomendacion}
                                size="small"
                                color={
                                  resultado.recomendacion === 'APROBADO' ? 'success' :
                                  resultado.recomendacion === 'REVISION' ? 'warning' :
                                  'error'
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              {Number(resultado.confianza).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {resultadosLote.detalles_errores && resultadosLote.detalles_errores.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom color="error">
                    Errores Encontrados
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Postulación ID</strong></TableCell>
                          <TableCell><strong>Estudiante</strong></TableCell>
                          <TableCell><strong>Error</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {resultadosLote.detalles_errores.map((error: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{error.postulacion_id}</TableCell>
                            <TableCell>{error.estudiante || '-'}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="error">
                                {error.error}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogResultados(false)} variant="contained">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
