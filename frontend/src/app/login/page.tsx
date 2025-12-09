/**
 * Landing Page y Login de DUBS
 * Dirección Universitaria de Bienestar Social - UAGRM
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent,
  Paper
} from '@mui/material';
import { 
  Login as LoginIcon, 
  PersonAdd, 
  Visibility as VisionIcon,
  TrackChanges as MisionIcon,
  EmojiEvents as ObjectivosIcon,
  School as SchoolIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { login } from '@/services/keycloak';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated: authState, isLoading } = useAuthStore();

  useEffect(() => {
    if (authState && !isLoading) {
      router.push('/dashboard');
    }
  }, [authState, isLoading, router]);

  const handleLogin = () => {
    login();
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#C62828' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Header con logo institucional */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #003D82 0%, #00509E 100%)',
          py: 2,
          borderBottom: '4px solid #C62828'
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: '#C62828', 
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                fontWeight: 900,
                fontSize: '28px',
                color: 'white'
              }}
            >
              D
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                D.U.B.S.S.
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Dirección Universitaria de Bienestar Social y Salud
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Hero Section - Acceso al Sistema */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #C62828 0%, #8E0000 100%)',
          py: 8,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            width: '50%',
            height: '100%',
            opacity: 0.1,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'40\' fill=\'white\'/%3E%3C/svg%3E")',
            backgroundSize: '200px',
            backgroundRepeat: 'repeat'
          }}
        />
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                Sistema de Gestión de Becas
              </Typography>
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                Universidad Autónoma Gabriel René Moreno
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, maxWidth: 600 }}>
                Plataforma integral para la gestión, postulación y seguimiento de becas universitarias. 
                Velando por la salud integral de la comunidad universitaria.
              </Typography>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper 
                elevation={8}
                sx={{ 
                  p: 4, 
                  borderRadius: 3,
                  bgcolor: 'white'
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#003D82', mb: 1 }}>
                    Acceso al Sistema
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ingrese con sus credenciales institucionales
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={handleLogin}
                  sx={{ 
                    py: 1.5,
                    bgcolor: '#003D82',
                    '&:hover': { bgcolor: '#002855' },
                    mb: 2
                  }}
                >
                  Iniciar Sesión con Keycloak
                </Button>

                <Box sx={{ textAlign: 'center', my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    ¿Eres estudiante y no tienes cuenta?
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  component={Link}
                  href="/register"
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  sx={{ 
                    py: 1.5,
                    borderColor: '#C62828',
                    color: '#C62828',
                    '&:hover': { 
                      borderColor: '#8E0000',
                      bgcolor: 'rgba(198, 40, 40, 0.04)'
                    }
                  }}
                >
                  Registrarse como Estudiante
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Marco Institucional */}
      <Box sx={{ py: 8, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: '#C62828',
                mb: 1,
                textTransform: 'uppercase'
              }}
            >
              Marco Institucional
            </Typography>
            <Box sx={{ width: 80, height: 4, bgcolor: '#003D82', mx: 'auto', borderRadius: 2 }} />
          </Box>

          <Grid container spacing={4}>
            {/* Misión */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={3}
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  border: '2px solid #C62828',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-8px)' }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box 
                      sx={{ 
                        bgcolor: '#C62828', 
                        borderRadius: '50%', 
                        p: 2, 
                        mr: 2,
                        display: 'flex'
                      }}
                    >
                      <MisionIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#C62828' }}>
                      Misión
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8 }}>
                    La Dirección Universitaria de Bienestar Social (D.U.B.S.) es una unidad que 
                    contribuye al bienestar social de la población de la UAGRM siendo el órgano que 
                    planifica, programa y coordina acciones orientadas a promover el desarrollo físico, 
                    mental, psicoafectivo, cognoscitivo y social de los estudiantes, docentes y administrativos.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Visión */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={3}
                sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  border: '2px solid #003D82',
                  transition: 'transform 0.3s',
                  '&:hover': { transform: 'translateY(-8px)' }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box 
                      sx={{ 
                        bgcolor: '#003D82', 
                        borderRadius: '50%', 
                        p: 2, 
                        mr: 2,
                        display: 'flex'
                      }}
                    >
                      <VisionIcon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#003D82' }}>
                      Visión
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.8 }}>
                    Ser una dirección que brinde servicio de calidez a la comunidad universitaria 
                    velando por el bienestar social, académico, cultural y deportivo de la población 
                    universitaria, proyectándose como una de las mejores direcciones de la universidad.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Objetivos */}
      <Box sx={{ py: 8, bgcolor: '#003D82' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: 'white',
                mb: 1,
                textTransform: 'uppercase'
              }}
            >
              Objetivos
            </Typography>
            <Box sx={{ width: 80, height: 4, bgcolor: '#C62828', mx: 'auto', borderRadius: 2 }} />
          </Box>

          <Grid container spacing={3}>
            {[
              'Impulsar el desarrollo, el mantenimiento y el equilibrio del bienestar social en la comunidad Universitaria, en el marco de los deberes institucionales.',
              'Velar por la salud integral de la comunidad universitaria, mediante acciones preventivas y asistencia médica oportuna.',
              'Contribuir a la solución o mitigación de los problemas socio-económicos, familiares, académicos y laborales de la comunidad universitaria que obstaculicen el bienestar integral de las personas beneficiarias.',
              'Promover la capacitación y la formación integral humana.',
              'Gestionar y establecer convenios de cooperación institucional a nivel regional, nacional e internacional, destinados a la búsqueda del bienestar social universitario.',
              'Planificar, desarrollar y ejecutar políticas de ayuda e incentivo a los estudiantes mediante becas de: Alimentación, Albergue, Estudios de Pre y Postgrado, Instalaciones Deportivas, Beca-Trabajo, Tesis y otras según reglamentación.'
            ].map((objetivo, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <ObjectivosIcon sx={{ color: '#C62828', fontSize: 28, mt: 0.5 }} />
                  <Typography variant="body1" sx={{ color: 'white', lineHeight: 1.7 }}>
                    {objetivo}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Tipos de Becas */}
      <Box sx={{ py: 8, bgcolor: '#F5F5F5' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                color: '#C62828',
                mb: 1,
                textTransform: 'uppercase'
              }}
            >
              Tipos de Becas Disponibles
            </Typography>
            <Box sx={{ width: 80, height: 4, bgcolor: '#003D82', mx: 'auto', borderRadius: 2 }} />
          </Box>

          <Grid container spacing={3}>
            {[
              { title: 'Comedor Universitario', description: 'Alimentación subsidiada para estudiantes' },
              { title: 'Guardería', description: 'Cuidado infantil para hijos de estudiantes' },
              { title: 'Beca-Trabajo', description: 'Apoyo económico mediante trabajo en la universidad' },
              { title: 'Estudios de Pre y Postgrado', description: 'Financiamiento para estudios avanzados' },
              { title: 'Instalaciones Deportivas', description: 'Acceso a infraestructura deportiva' },
              { title: 'Alojamiento', description: 'Albergue universitario para estudiantes' },
              { title: 'Titulación y Tesis', description: 'Apoyo para culminación de estudios' },
              { title: 'Otras Becas', description: 'Según reglamentación vigente' }
            ].map((beca, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  elevation={2}
                  sx={{ 
                    height: '100%',
                    borderRadius: 3,
                    textAlign: 'center',
                    transition: 'all 0.3s',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                      borderColor: '#C62828',
                      borderWidth: 2,
                      borderStyle: 'solid'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <SchoolIcon sx={{ fontSize: 48, color: '#003D82', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#C62828', mb: 1 }}>
                      {beca.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {beca.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: '#003D82', borderTop: '4px solid #C62828' }}>
        <Container maxWidth="lg">
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" sx={{ color: 'white', mb: 1 }}>
                <strong>Dirección Universitaria de Bienestar Social y Salud (D.U.B.S.S.)</strong>
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Universidad Autónoma Gabriel René Moreno - Santa Cruz, Bolivia
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                © 2025 UAGRM - Todos los derechos reservados
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
