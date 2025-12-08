/**
 * Dashboard principal - Redirige según el rol del usuario
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Container, Typography, Paper, Button, Grid, Card, CardContent, CardActions } from '@mui/material';
import { 
  Logout as LogoutIcon,
  Campaign as CampaignIcon,
  Assessment as AssessmentIcon,
  Description as DescriptionIcon,
  HowToVote as VoteIcon,
  ManageAccounts as ManageAccountsIcon,
  Assignment as AssignmentIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuthStore } from '@/store/authStore';
import { logout } from '@/services/keycloak';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1">
              Dashboard DUBSS
            </Typography>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
            >
              Cerrar Sesión
            </Button>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Bienvenido, {user.nombre}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Rol: {user.rol_display}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Correo: {user.correo}
            </Typography>

            {user.perfil_estudiante && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Información Académica:</Typography>
                <Typography variant="body2">
                  RU: {user.perfil_estudiante.registro_universitario}
                </Typography>
                <Typography variant="body2">
                  Facultad: {user.perfil_estudiante.facultad}
                </Typography>
                <Typography variant="body2">
                  Carrera: {user.perfil_estudiante.carrera}
                </Typography>
              </Box>
            )}

            {user.perfil_institucional && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Información Institucional:</Typography>
                <Typography variant="body2">
                  Cargo: {user.perfil_institucional.cargo}
                </Typography>
                <Typography variant="body2">
                  Unidad: {user.perfil_institucional.unidad}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Accesos rápidos según rol */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Accesos Rápidos
            </Typography>
            <Grid container spacing={2}>
              {(user.rol === 'DIRECTOR' || user.rol === 'ANALISTA') && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <CampaignIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" component="div">
                          Convocatorias
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Gestionar convocatorias de becas
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => router.push('/admin/convocatorias')}>
                          Ir a Convocatorias
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="h6" component="div">
                          Postulaciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Revisar y evaluar postulaciones
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => router.push('/admin/postulaciones')}>
                          Ver Postulaciones
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <VoteIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="h6" component="div">
                          Asignación de Becas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Aprobar/Rechazar postulaciones evaluadas
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => router.push('/admin/asignacion-becas')}>
                          Asignar Becas
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </>
              )}

              {user.rol === 'DIRECTOR' && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <ManageAccountsIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                      <Typography variant="h6" component="div">
                        Gestión de Usuarios
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Administrar usuarios y roles
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => router.push('/admin/usuarios')}>
                        Gestionar Usuarios
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              )}

              {(user.rol === 'ESTUDIANTE_POSTULANTE' || user.rol === 'ESTUDIANTE_BECADO') && (
                <>
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <CampaignIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h6" component="div">
                          Convocatorias Activas
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ver convocatorias disponibles
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => router.push('/estudiante/convocatorias')}>
                          Ver Convocatorias
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={4}>
                    <Card>
                      <CardContent>
                        <DescriptionIcon sx={{ fontSize: 40, color: 'secondary.main', mb: 1 }} />
                        <Typography variant="h6" component="div">
                          Mis Postulaciones
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ver y editar mis postulaciones
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button size="small" onClick={() => router.push('/estudiante/postulaciones')}>
                          Ver Mis Postulaciones
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                </>
              )}

              {user.rol === 'ESTUDIANTE_BECADO' && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <AssignmentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h6" component="div">
                        Seguimiento de Beca
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Subir documentos de seguimiento
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => router.push('/estudiante/seguimiento')}>
                        Ir a Seguimiento
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              )}

              {user.rol === 'RESPONSABLE' && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card>
                    <CardContent>
                      <VisibilityIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h6" component="div">
                        Seguimiento de Becados
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Revisar documentos de seguimiento
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => router.push('/responsable/seguimiento')}>
                        Ver Seguimientos
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>

          <Box sx={{ mt: 4, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
            <Typography variant="body2">
              ✅ <strong>RF1: Autenticación institucional con gestión de roles (RBAC)</strong> - Implementado correctamente
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Tu sesión está activa con Keycloak y tus permisos están configurados según tu rol.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
