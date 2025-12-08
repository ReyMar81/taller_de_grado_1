'use client';

import { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  rol_display: string;
  is_active: boolean;
  keycloak_roles?: string[];
  fecha_creacion: string;
}

export default function GestionUsuariosPage() {
  const { token } = useAuthStore();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Diálogos
  const [dialogCrear, setDialogCrear] = useState(false);
  const [dialogRolesMultiples, setDialogRolesMultiples] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  
  // Formulario nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'ANALISTA',
  });
  
  // Roles múltiples
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/users/administrativos/');
      // Asegurarse de que sea un array
      const data = Array.isArray(response.data) ? response.data : response.data.results || [];
      setUsuarios(data);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError('Error al cargar usuarios: ' + (err.response?.data?.detail || err.message));
      setUsuarios([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiClient.post('/users/administrativos/', nuevoUsuario);
      
      setSuccess('Usuario creado correctamente');
      setDialogCrear(false);
      setNuevoUsuario({
        nombre: '',
        correo: '',
        password: '',
        rol: 'ANALISTA',
      });
      await cargarUsuarios();
    } catch (err: any) {
      setError('Error al crear usuario: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGestionarRoles = async () => {
    if (!usuarioSeleccionado) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    // Determinar qué roles asignar y cuáles quitar
    const rolesActuales = usuarioSeleccionado.keycloak_roles || [usuarioSeleccionado.rol];
    const todosRoles = ['DIRECTOR', 'ANALISTA', 'RESPONSABLE'];
    
    // Roles que están seleccionados pero no están en Keycloak
    const roles_asignar = rolesSeleccionados.filter(rol => !rolesActuales.includes(rol));
    
    // Roles que están en Keycloak pero ya no están seleccionados
    const roles_quitar = rolesActuales.filter(rol => 
      todosRoles.includes(rol) && !rolesSeleccionados.includes(rol)
    );
    
    console.log('Roles actuales en Keycloak:', rolesActuales);
    console.log('Roles seleccionados:', rolesSeleccionados);
    console.log('Roles a asignar:', roles_asignar);
    console.log('Roles a quitar:', roles_quitar);
    
    try {
      const response = await apiClient.post(
        `/users/administrativos/${usuarioSeleccionado.id}/gestionar_roles/`,
        {
          roles_asignar,
          roles_quitar
        }
      );
      
      setSuccess(response.data.message);
      setDialogRolesMultiples(false);
      setUsuarioSeleccionado(null);
      setRolesSeleccionados([]);
      await cargarUsuarios();
    } catch (err: any) {
      setError('Error al gestionar roles: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivarUsuario = async (usuario: Usuario) => {
    if (!confirm(`¿Está seguro de desactivar al usuario ${usuario.nombre}?`)) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await apiClient.post(
        `/users/administrativos/${usuario.id}/desactivar/`,
        {}
      );
      
      setSuccess(response.data.message);
      await cargarUsuarios();
    } catch (err: any) {
      setError('Error al desactivar usuario: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const abrirDialogRolesMultiples = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    // Inicializar con los roles de Keycloak si existen, sino con el rol de Django
    const rolesActuales = usuario.keycloak_roles && usuario.keycloak_roles.length > 0 
      ? usuario.keycloak_roles 
      : [usuario.rol];
    setRolesSeleccionados(rolesActuales);
    setDialogRolesMultiples(true);
  };

  const toggleRol = (rol: string) => {
    setRolesSeleccionados((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol]
    );
  };

  const getRolColor = (rol: string) => {
    switch (rol) {
      case 'DIRECTOR':
        return 'error';
      case 'ANALISTA':
        return 'primary';
      case 'RESPONSABLE':
        return 'secondary';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestión de Usuarios Administrativos</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={cargarUsuarios}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogCrear(true)}
          >
            Nuevo Usuario
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

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Correo</strong></TableCell>
              <TableCell><strong>Roles Keycloak</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell>{usuario.nombre}</TableCell>
                <TableCell>{usuario.correo}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {usuario.keycloak_roles && usuario.keycloak_roles.length > 0 ? (
                      usuario.keycloak_roles.map((rol) => (
                        <Chip
                          key={rol}
                          label={rol.replace('_', ' ')}
                          color={getRolColor(rol)}
                          size="small"
                        />
                      ))
                    ) : (
                      <Chip
                        label={usuario.rol_display}
                        color={getRolColor(usuario.rol)}
                        size="small"
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={usuario.is_active ? 'Activo' : 'Inactivo'}
                    color={usuario.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Gestionar roles">
                    <IconButton
                      size="small"
                      onClick={() => abrirDialogRolesMultiples(usuario)}
                      disabled={!usuario.is_active}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Desactivar usuario">
                    <IconButton
                      size="small"
                      onClick={() => handleDesactivarUsuario(usuario)}
                      disabled={!usuario.is_active}
                      color="error"
                    >
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Diálogo Crear Usuario */}
      <Dialog open={dialogCrear} onClose={() => setDialogCrear(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Usuario Administrativo</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Correo electrónico"
                type="email"
                value={nuevoUsuario.correo}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={nuevoUsuario.password}
                onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={nuevoUsuario.rol}
                  label="Rol"
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value })}
                >
                  <MenuItem value="DIRECTOR">Director</MenuItem>
                  <MenuItem value="ANALISTA">Analista de Becas</MenuItem>
                  <MenuItem value="RESPONSABLE">Responsable de Seguimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogCrear(false)}>Cancelar</Button>
          <Button onClick={handleCrearUsuario} variant="contained" disabled={loading}>
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Gestionar Roles */}
      <Dialog open={dialogRolesMultiples} onClose={() => setDialogRolesMultiples(false)}>
        <DialogTitle>Gestionar Roles del Usuario</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Usuario: <strong>{usuarioSeleccionado?.nombre}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona los roles que debe tener este usuario en Keycloak. 
            Puedes asignar múltiples roles simultáneamente.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={rolesSeleccionados.includes('DIRECTOR')}
                  onChange={() => toggleRol('DIRECTOR')}
                />
              }
              label="Director DUBSS"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rolesSeleccionados.includes('ANALISTA')}
                  onChange={() => toggleRol('ANALISTA')}
                />
              }
              label="Analista de Becas"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={rolesSeleccionados.includes('RESPONSABLE')}
                  onChange={() => toggleRol('RESPONSABLE')}
                />
              }
              label="Responsable de Seguimiento"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogRolesMultiples(false)}>Cancelar</Button>
          <Button onClick={handleGestionarRoles} variant="contained" disabled={loading}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
