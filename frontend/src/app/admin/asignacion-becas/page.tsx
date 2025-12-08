'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Search,
  Clear,
  CheckBox,
  CheckBoxOutlineBlank,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Convocatoria {
  id: string;
  titulo: string;
  gestion: string;
  tipos_beca: string[];
}

interface Postulacion {
  id: string;
  estudiante_nombre: string;
  estudiante_ru: string;
  estudiante_facultad: string;
  convocatoria_titulo: string;
  tipo_beca_nombre: string;
  puntaje_total: number;
  estado: string;
}

export default function AsignacionBecasPage() {
  const { token } = useAuthStore();
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [convocatoriaId, setConvocatoriaId] = useState('');
  const [postulaciones, setPostulaciones] = useState<Postulacion[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estados para diálogos de confirmación
  const [dialogAprobar, setDialogAprobar] = useState(false);
  const [dialogRechazar, setDialogRechazar] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    aprobadas: 0,
    rechazadas: 0,
    pendientes: 0,
  });

  useEffect(() => {
    cargarConvocatorias();
  }, []);

  useEffect(() => {
    if (convocatoriaId) {
      cargarPostulaciones();
    }
  }, [convocatoriaId]);
  const cargarConvocatorias = async () => {
    try {
      const response = await axios.get(`${API_URL}/convocatorias/`, {
        params: { page_size: 100 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setConvocatorias(response.data.results || []);
    } catch (err: any) {
      console.error('Error al cargar convocatorias:', err);
    }
  };

  const cargarPostulaciones = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/postulaciones/`, {
        params: {
          convocatoria: convocatoriaId,
          page_size: 1000,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const todasPostulaciones = response.data.results || [];
      
      // Calcular estadísticas
      const total = todasPostulaciones.length;
      const aprobadas = todasPostulaciones.filter((p: Postulacion) => p.estado === 'APROBADO').length;
      const rechazadas = todasPostulaciones.filter((p: Postulacion) => p.estado === 'RECHAZADO').length;
      const pendientes = todasPostulaciones.filter((p: Postulacion) => p.estado === 'EVALUADO').length;

      setStats({ total, aprobadas, rechazadas, pendientes });

      // Mostrar solo las EVALUADO (pendientes de decisión)
      const evaluadas = todasPostulaciones.filter((p: Postulacion) => p.estado === 'EVALUADO');
      setPostulaciones(evaluadas);
      setSeleccionadas(new Set());
    } catch (err: any) {
      setError('Error al cargar postulaciones: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const postulacionesFiltradas = postulaciones.filter((p) => {
    if (!busqueda) return true;
    const searchLower = busqueda.toLowerCase();
    return (
      p.estudiante_nombre.toLowerCase().includes(searchLower) ||
      p.estudiante_ru.toLowerCase().includes(searchLower) ||
      p.puntaje_total.toString().includes(searchLower)
    );
  });

  const handleSeleccionarTodo = () => {
    if (seleccionadas.size === postulacionesFiltradas.length) {
      setSeleccionadas(new Set());
    } else {
      setSeleccionadas(new Set(postulacionesFiltradas.map((p) => p.id)));
    }
  };

  const handleToggleSeleccion = (id: string) => {
    const newSeleccionadas = new Set(seleccionadas);
    if (newSeleccionadas.has(id)) {
      newSeleccionadas.delete(id);
    } else {
      newSeleccionadas.add(id);
    }
    setSeleccionadas(newSeleccionadas);
  };

  const handleAprobarSeleccionadas = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(
        `${API_URL}/postulaciones/asignar_becas/`,
        {
          postulacion_ids: Array.from(seleccionadas),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        `✅ Se asignaron ${response.data.length} becas correctamente. Los estudiantes ahora tienen el rol ESTUDIANTE_BECADO.`
      );
      setSeleccionadas(new Set());
      setDialogAprobar(false);
      
      // Recargar postulaciones para actualizar estadísticas
      await cargarPostulaciones();
    } catch (err: any) {
      setError('Error al asignar becas: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRechazarRestantes = async () => {
    if (!motivoRechazo.trim()) {
      setError('Debe proporcionar un motivo de rechazo');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Rechazar TODAS las postulaciones EVALUADO de esta convocatoria
      const idsEvaluadas = postulaciones.map((p) => p.id);
      
      const response = await axios.post(
        `${API_URL}/postulaciones/rechazar_postulaciones/`,
        {
          postulacion_ids: idsEvaluadas,
          motivo: motivoRechazo,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        `❌ Se rechazaron ${response.data.length} postulaciones. Motivo: "${motivoRechazo}"`
      );
      setSeleccionadas(new Set());
      setDialogRechazar(false);
      setMotivoRechazo('');
      
      // Recargar postulaciones para actualizar estadísticas
      await cargarPostulaciones();
    } catch (err: any) {
      setError('Error al rechazar postulaciones: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Asignación de Becas Post-Comité
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="text.secondary" paragraph>
          Esta vista permite asignar becas a estudiantes después de la decisión del comité evaluador.
          Seleccione la convocatoria, busque y seleccione los estudiantes aprobados, y finalmente
          rechace las postulaciones restantes.
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Convocatoria</InputLabel>
          <Select
            value={convocatoriaId}
            onChange={(e) => setConvocatoriaId(e.target.value)}
            label="Convocatoria"
          >
            <MenuItem value="">
              <em>Seleccione una convocatoria</em>
            </MenuItem>
            {convocatorias.map((conv) => (
              <MenuItem key={conv.id} value={conv.id}>
                {conv.titulo} - {conv.gestion} ({conv.tipos_beca.join(', ')})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {convocatoriaId && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light' }}>
                <Typography variant="h4">{stats.total}</Typography>
                <Typography variant="body2">Total Postulaciones</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light' }}>
                <Typography variant="h4">{stats.aprobadas}</Typography>
                <Typography variant="body2">Aprobadas</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light' }}>
                <Typography variant="h4">{stats.rechazadas}</Typography>
                <Typography variant="body2">Rechazadas</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light' }}>
                <Typography variant="h4">{stats.pendientes}</Typography>
                <Typography variant="body2">Pendientes</Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Paper>

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

      {convocatoriaId && postulaciones.length === 0 && !loading && (
        <Alert severity="info">
          No hay postulaciones en estado EVALUADO para esta convocatoria.
          {stats.aprobadas > 0 && ` Ya se aprobaron ${stats.aprobadas} postulaciones.`}
          {stats.rechazadas > 0 && ` Ya se rechazaron ${stats.rechazadas} postulaciones.`}
        </Alert>
      )}

      {convocatoriaId && postulaciones.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Buscar estudiante"
              variant="outlined"
              size="small"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, email, código SIS, puntaje..."
              sx={{ flexGrow: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                endAdornment: busqueda && (
                  <IconButton size="small" onClick={() => setBusqueda('')}>
                    <Clear />
                  </IconButton>
                ),
              }}
            />

            <Tooltip title="Seleccionar/Deseleccionar todos los filtrados">
              <Button
                variant="outlined"
                onClick={handleSeleccionarTodo}
                startIcon={seleccionadas.size > 0 ? <CheckBoxOutlineBlank /> : <CheckBox />}
              >
                {seleccionadas.size > 0 ? 'Deseleccionar' : 'Seleccionar'} Todos
              </Button>
            </Tooltip>

            <Chip
              label={`${seleccionadas.size} seleccionados`}
              color={seleccionadas.size > 0 ? 'primary' : 'default'}
            />
          </Box>

          <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              disabled={seleccionadas.size === 0 || loading}
              onClick={() => setDialogAprobar(true)}
            >
              Aprobar Seleccionadas ({seleccionadas.size})
            </Button>

            <Button
              variant="contained"
              color="error"
              startIcon={<Cancel />}
              disabled={postulaciones.length === 0 || loading}
              onClick={() => setDialogRechazar(true)}
            >
              Rechazar Restantes ({postulaciones.length})
            </Button>
          </Box>

          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={
                        postulacionesFiltradas.length > 0 &&
                        seleccionadas.size === postulacionesFiltradas.length
                      }
                      indeterminate={
                        seleccionadas.size > 0 &&
                        seleccionadas.size < postulacionesFiltradas.length
                      }
                      onChange={handleSeleccionarTodo}
                    />
                  </TableCell>
                  <TableCell>Código SIS</TableCell>
                  <TableCell>Estudiante</TableCell>
                  <TableCell>Facultad</TableCell>
                  <TableCell>Puntaje</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {postulacionesFiltradas.map((postulacion) => (
                  <TableRow
                    key={postulacion.id}
                    hover
                    selected={seleccionadas.has(postulacion.id)}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleToggleSeleccion(postulacion.id)}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox checked={seleccionadas.has(postulacion.id)} />
                    </TableCell>
                    <TableCell>{postulacion.estudiante_ru}</TableCell>
                    <TableCell>{postulacion.estudiante_nombre}</TableCell>
                    <TableCell>{postulacion.estudiante_facultad}</TableCell>
                    <TableCell>
                      <Chip
                        label={postulacion.puntaje_total.toFixed(1)}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label={postulacion.estado} color="warning" size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {postulacionesFiltradas.length === 0 && busqueda && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No se encontraron postulaciones que coincidan con &quot;{busqueda}&quot;
            </Alert>
          )}
        </Paper>
      )}

      {/* Diálogo de confirmación para aprobar */}
      <Dialog open={dialogAprobar} onClose={() => setDialogAprobar(false)}>
        <DialogTitle>Confirmar Asignación de Becas</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea APROBAR {seleccionadas.size} postulaciones seleccionadas?
            <br />
            <br />
            Esto realizará las siguientes acciones:
            <ul>
              <li>Cambiar el estado de las postulaciones a <strong>APROBADO</strong></li>
              <li>Agregar el rol <strong>ESTUDIANTE_BECADO</strong> a los usuarios</li>
            </ul>
            Esta acción no se puede deshacer fácilmente.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogAprobar(false)}>Cancelar</Button>
          <Button
            onClick={handleAprobarSeleccionadas}
            color="success"
            variant="contained"
            autoFocus
          >
            Confirmar Aprobación
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para rechazar */}
      <Dialog open={dialogRechazar} onClose={() => setDialogRechazar(false)}>
        <DialogTitle>Confirmar Rechazo de Postulaciones Restantes</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea RECHAZAR las {postulaciones.length} postulaciones restantes
            en estado EVALUADO?
            <br />
            <br />
            Debe proporcionar un motivo de rechazo:
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Motivo de rechazo"
            fullWidth
            multiline
            rows={3}
            value={motivoRechazo}
            onChange={(e) => setMotivoRechazo(e.target.value)}
            placeholder="Ej: No alcanzó el puntaje mínimo según decisión del comité evaluador"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRechazar(false)}>Cancelar</Button>
          <Button
            onClick={handleRechazarRestantes}
            color="error"
            variant="contained"
            disabled={!motivoRechazo.trim()}
          >
            Confirmar Rechazo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
