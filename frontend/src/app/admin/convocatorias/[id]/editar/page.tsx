'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';

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

interface Convocatoria {
  id: string;
  titulo: string;
  descripcion: string;
  gestion: string;
  periodo: number;
  fecha_inicio: string;
  fecha_cierre: string;
  fecha_publicacion: string | null;
  estado: string;
}

interface TipoBeca {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  monto_mensual: string;
  duracion_meses: number;
  es_pago_directo: boolean;
}

interface Cupo {
  id: string;
  tipo_beca: string;
  tipo_beca_nombre: string;
  facultad: string;
  cantidad: number;
}

interface Criterio {
  id: string;
  nombre: string;
  descripcion: string;
  ponderacion: number;
  tipo_dato: string;
  valor_minimo?: number;
  valor_maximo?: number;
}

interface Requisito {
  id: string;
  nombre: string;
  descripcion: string;
  es_obligatorio: boolean;
  tipo_archivo: string;
}

const FACULTADES = [
  'INGENIERIA',
  'CIENCIAS EXACTAS',
  'MEDICINA',
  'DERECHO',
  'ECONOMIA',
  'HUMANIDADES',
  'CIENCIAS AGRICOLAS',
  'ARQUITECTURA',
  'VETERINARIA',
  'FICCT',
  'TODAS'
];

const TIPOS_DATO = ['NUMERICO', 'TEXTO', 'BOOLEAN', 'FECHA', 'ARCHIVO'];
const TIPOS_ARCHIVO = ['PDF', 'IMAGEN', 'DOCUMENTO', 'CUALQUIERA'];

export default function EditarConvocatoriaPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user, token } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  
  // Estado de la convocatoria
  const [convocatoria, setConvocatoria] = useState<Convocatoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para cupos
  const [cupos, setCupos] = useState<Cupo[]>([]);
  const [tiposBeca, setTiposBeca] = useState<TipoBeca[]>([]);
  const [cupoDialog, setCupoDialog] = useState(false);
  const [cupoEditando, setCupoEditando] = useState<Cupo | null>(null);
  const [nuevoCupo, setNuevoCupo] = useState({
    tipo_beca: '',
    facultad: '',
    cantidad: 1
  });

  // Estados para criterios
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [criterioDialog, setCriterioDialog] = useState(false);
  const [criterioEditando, setCriterioEditando] = useState<Criterio | null>(null);
  const [nuevoCriterio, setNuevoCriterio] = useState({
    nombre: '',
    descripcion: '',
    ponderacion: 0,
    tipo_dato: 'NUMERICO',
    valor_minimo: undefined as number | undefined,
    valor_maximo: undefined as number | undefined
  });

  // Estados para requisitos
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [requisitoDialog, setRequisitoDialog] = useState(false);
  const [requisitoEditando, setRequisitoEditando] = useState<Requisito | null>(null);
  const [nuevoRequisito, setNuevoRequisito] = useState({
    nombre: '',
    descripcion: '',
    es_obligatorio: true,
    tipo_archivo: 'PDF'
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user?.rol !== 'DIRECTOR' && user?.rol !== 'ANALISTA') {
      router.push('/dashboard');
      return;
    }

    if (token && params.id) {
      fetchConvocatoria();
      fetchTiposBeca();
      fetchCupos();
      fetchRequisitos();
    }
  }, [isAuthenticated, user, token, params.id, router]);

  const fetchConvocatoria = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/convocatorias/${params.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar convocatoria');

      const data = await response.json();
      setConvocatoria(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar convocatoria');
    } finally {
      setLoading(false);
    }
  };

  const fetchTiposBeca = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/tipos-beca/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar tipos de beca');

      const data = await response.json();
      const becasArray = Array.isArray(data) ? data : (data.results || []);
      setTiposBeca(becasArray);
    } catch (err) {
      console.error('Error al cargar tipos de beca:', err);
    }
  };

  const fetchCupos = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/convocatorias/${params.id}/cupos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar cupos');

      const data = await response.json();
      const cuposArray = Array.isArray(data) ? data : (data.results || []);
      setCupos(cuposArray);
    } catch (err) {
      console.error('Error al cargar cupos:', err);
    }
  };



  const fetchRequisitos = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/convocatorias/${params.id}/requisitos/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al cargar requisitos');

      const data = await response.json();
      const requisitosArray = Array.isArray(data) ? data : (data.results || []);
      setRequisitos(requisitosArray);
    } catch (err) {
      console.error('Error al cargar requisitos:', err);
    }
  };

  // Funciones para cupos
  const handleAgregarCupo = async () => {
    try {
      setError('');
      setSuccess('');

      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      const method = cupoEditando ? 'PUT' : 'POST';
      const url = cupoEditando
        ? `http://localhost:8000/api/cupos/${cupoEditando.id}/`
        : `http://localhost:8000/api/cupos/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevoCupo,
          convocatoria: params.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar cupo');
      }

      setSuccess(cupoEditando ? 'Cupo actualizado exitosamente' : 'Cupo agregado exitosamente');
      setCupoDialog(false);
      setNuevoCupo({ tipo_beca: '', facultad: '', cantidad: 1 });
      setCupoEditando(null);
      fetchCupos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar cupo');
    }
  };

  const handleEliminarCupo = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cupo?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/cupos/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al eliminar cupo');

      setSuccess('Cupo eliminado exitosamente');
      fetchCupos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar cupo');
    }
  };

  // Funciones para criterios
  const handleAgregarCriterio = async () => {
    try {
      setError('');
      setSuccess('');

      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      const method = criterioEditando ? 'PUT' : 'POST';
      const url = criterioEditando
        ? `http://localhost:8000/api/criterios/${criterioEditando.id}/`
        : `http://localhost:8000/api/criterios/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevoCriterio,
          convocatoria: params.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar criterio');
      }

      setSuccess(criterioEditando ? 'Criterio actualizado exitosamente' : 'Criterio agregado exitosamente');
      setCriterioDialog(false);
      setNuevoCriterio({ nombre: '', descripcion: '', ponderacion: 0, tipo_dato: 'NUMERICO', valor_minimo: undefined, valor_maximo: undefined });
      setCriterioEditando(null);
      fetchCriterios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar criterio');
    }
  };

  const handleEliminarCriterio = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este criterio?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/criterios/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al eliminar criterio');

      setSuccess('Criterio eliminado exitosamente');
      fetchCriterios();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar criterio');
    }
  };

  // Funciones para requisitos
  const handleAgregarRequisito = async () => {
    try {
      setError('');
      setSuccess('');

      if (!token) {
        setError('No se pudo obtener el token de autenticación');
        return;
      }

      const method = requisitoEditando ? 'PUT' : 'POST';
      const url = requisitoEditando
        ? `http://localhost:8000/api/requisitos/${requisitoEditando.id}/`
        : `http://localhost:8000/api/requisitos/`;

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...nuevoRequisito,
          convocatoria: params.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar requisito');
      }

      setSuccess(requisitoEditando ? 'Requisito actualizado exitosamente' : 'Requisito agregado exitosamente');
      setRequisitoDialog(false);
      setNuevoRequisito({ nombre: '', descripcion: '', es_obligatorio: true, tipo_archivo: 'PDF' });
      setRequisitoEditando(null);
      fetchRequisitos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar requisito');
    }
  };

  const handleEliminarRequisito = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este requisito?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/requisitos/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Error al eliminar requisito');

      setSuccess('Requisito eliminado exitosamente');
      fetchRequisitos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar requisito');
    }
  };

  const calcularPonderacionTotal = () => {
    return criterios.reduce((sum, c) => sum + c.ponderacion, 0);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Cargando...</Typography>
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
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button 
                variant="outlined" 
                startIcon={<ArrowBackIcon />}
                onClick={() => router.push('/admin/convocatorias')}
                sx={{ 
                  color: '#C62828', 
                  borderColor: '#C62828',
                  '&:hover': { borderColor: '#8E0000', bgcolor: 'rgba(198,40,40,0.05)' }
                }}
              >
                Volver
              </Button>
              <Typography variant="h4" component="h1" sx={{ color: '#C62828', fontWeight: 700 }}>
                Editar Convocatoria
              </Typography>
            </Box>
          </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">
            {cupos.length > 0 
              ? `${cupos[0].tipo_beca_nombre}${cupos.length > 1 ? ` (+${cupos.length - 1} más)` : ''} - Gestión ${convocatoria.gestion}`
              : `Convocatoria - Gestión ${convocatoria.gestion}`
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Estado: {convocatoria.estado}
          </Typography>
        </Box>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Datos Básicos" />
          <Tab label={`Cupos (${cupos.length})`} />
          <Tab label={`Requisitos (${requisitos.length})`} />
        </Tabs>

        {/* Tab 0: Datos Básicos */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={convocatoria.titulo}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descripción"
                value={convocatoria.descripcion}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Gestión"
                value={convocatoria.gestion}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Periodo"
                value={convocatoria.periodo}
                InputProps={{ readOnly: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Los datos básicos solo se pueden editar en estado BORRADOR desde la página de creación.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 1: Cupos */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Cupos por Tipo de Beca y Facultad</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setCupoEditando(null);
                setNuevoCupo({ tipo_beca: '', facultad: '', cantidad: 1 });
                setCupoDialog(true);
              }}
              disabled={convocatoria.estado !== 'BORRADOR'}
            >
              Agregar Cupo
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo de Beca</TableCell>
                  <TableCell>Facultad</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cupos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No hay cupos definidos
                    </TableCell>
                  </TableRow>
                ) : (
                  cupos.map((cupo) => (
                    <TableRow key={cupo.id}>
                      <TableCell>{cupo.tipo_beca_nombre}</TableCell>
                      <TableCell>{cupo.facultad}</TableCell>
                      <TableCell align="right">{cupo.cantidad}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setCupoEditando(cupo);
                            setNuevoCupo({
                              tipo_beca: cupo.tipo_beca,
                              facultad: cupo.facultad,
                              cantidad: cupo.cantidad
                            });
                            setCupoDialog(true);
                          }}
                          disabled={convocatoria.estado !== 'BORRADOR'}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminarCupo(cupo.id)}
                          disabled={convocatoria.estado !== 'BORRADOR'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {convocatoria.estado !== 'BORRADOR' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Solo se pueden editar cupos en estado BORRADOR
            </Alert>
          )}
        </TabPanel>

        {/* Tab 2: Requisitos */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Requisitos Documentales</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setRequisitoEditando(null);
                setNuevoRequisito({ nombre: '', descripcion: '', es_obligatorio: true, tipo_archivo: 'PDF' });
                setRequisitoDialog(true);
              }}
              disabled={convocatoria.estado !== 'BORRADOR'}
            >
              Agregar Requisito
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="center">Obligatorio</TableCell>
                  <TableCell>Tipo Archivo</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requisitos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay requisitos definidos
                    </TableCell>
                  </TableRow>
                ) : (
                  requisitos.map((requisito) => (
                    <TableRow key={requisito.id}>
                      <TableCell>{requisito.nombre}</TableCell>
                      <TableCell>{requisito.descripcion}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={requisito.es_obligatorio ? 'Sí' : 'No'}
                          color={requisito.es_obligatorio ? 'error' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{requisito.tipo_archivo}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setRequisitoEditando(requisito);
                            setNuevoRequisito({
                              nombre: requisito.nombre,
                              descripcion: requisito.descripcion,
                              es_obligatorio: requisito.es_obligatorio,
                              tipo_archivo: requisito.tipo_archivo
                            });
                            setRequisitoDialog(true);
                          }}
                          disabled={convocatoria.estado !== 'BORRADOR'}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleEliminarRequisito(requisito.id)}
                          disabled={convocatoria.estado !== 'BORRADOR'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {convocatoria.estado !== 'BORRADOR' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Solo se pueden editar requisitos en estado BORRADOR
            </Alert>
          )}
        </TabPanel>
      </Paper>

      {/* Dialog para agregar/editar cupo */}
      <Dialog open={cupoDialog} onClose={() => setCupoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{cupoEditando ? 'Editar Cupo' : 'Agregar Cupo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Beca</InputLabel>
              <Select
                value={nuevoCupo.tipo_beca}
                label="Tipo de Beca"
                onChange={(e) => setNuevoCupo({ ...nuevoCupo, tipo_beca: e.target.value })}
              >
                {tiposBeca.map((tipo) => (
                  <MenuItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre} - Bs. {tipo.monto_mensual}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Facultad</InputLabel>
              <Select
                value={nuevoCupo.facultad}
                label="Facultad"
                onChange={(e) => setNuevoCupo({ ...nuevoCupo, facultad: e.target.value })}
              >
                {FACULTADES.map((fac) => (
                  <MenuItem key={fac} value={fac}>{fac}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Cantidad"
              value={nuevoCupo.cantidad}
              onChange={(e) => setNuevoCupo({ ...nuevoCupo, cantidad: parseInt(e.target.value) || 1 })}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCupoDialog(false)}>Cancelar</Button>
          <Button onClick={handleAgregarCupo} variant="contained">
            {cupoEditando ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/editar criterio */}
      <Dialog open={criterioDialog} onClose={() => setCriterioDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{criterioEditando ? 'Editar Criterio' : 'Agregar Criterio'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={nuevoCriterio.nombre}
              onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, nombre: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripción"
              value={nuevoCriterio.descripcion}
              onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, descripcion: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              type="number"
              label="Ponderación %"
              value={nuevoCriterio.ponderacion}
              onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, ponderacion: parseFloat(e.target.value) || 0 })}
              InputProps={{ inputProps: { min: 0, max: 100, step: 0.1 } }}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Tipo de Dato</InputLabel>
              <Select
                value={nuevoCriterio.tipo_dato}
                label="Tipo de Dato"
                onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, tipo_dato: e.target.value })}
              >
                {TIPOS_DATO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {nuevoCriterio.tipo_dato === 'NUMERICO' && (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Valor Mínimo (opcional)"
                    value={nuevoCriterio.valor_minimo || ''}
                    onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, valor_minimo: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Valor Máximo (opcional)"
                    value={nuevoCriterio.valor_maximo || ''}
                    onChange={(e) => setNuevoCriterio({ ...nuevoCriterio, valor_maximo: e.target.value ? parseFloat(e.target.value) : undefined })}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCriterioDialog(false)}>Cancelar</Button>
          <Button onClick={handleAgregarCriterio} variant="contained">
            {criterioEditando ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para agregar/editar requisito */}
      <Dialog open={requisitoDialog} onClose={() => setRequisitoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{requisitoEditando ? 'Editar Requisito' : 'Agregar Requisito'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={nuevoRequisito.nombre}
              onChange={(e) => setNuevoRequisito({ ...nuevoRequisito, nombre: e.target.value })}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Descripción"
              value={nuevoRequisito.descripcion}
              onChange={(e) => setNuevoRequisito({ ...nuevoRequisito, descripcion: e.target.value })}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>¿Es Obligatorio?</InputLabel>
              <Select
                value={nuevoRequisito.es_obligatorio ? 'si' : 'no'}
                label="¿Es Obligatorio?"
                onChange={(e) => setNuevoRequisito({ ...nuevoRequisito, es_obligatorio: e.target.value === 'si' })}
              >
                <MenuItem value="si">Sí</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tipo de Archivo</InputLabel>
              <Select
                value={nuevoRequisito.tipo_archivo}
                label="Tipo de Archivo"
                onChange={(e) => setNuevoRequisito({ ...nuevoRequisito, tipo_archivo: e.target.value })}
              >
                {TIPOS_ARCHIVO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequisitoDialog(false)}>Cancelar</Button>
          <Button onClick={handleAgregarRequisito} variant="contained">
            {requisitoEditando ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>
        </Container>
      </Box>
  );
}
