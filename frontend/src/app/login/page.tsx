/**
 * Componente de página de login
 */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, Paper, Typography, CircularProgress, Divider, Link as MuiLink } from '@mui/material';
import { Login as LoginIcon, PersonAdd } from '@mui/icons-material';
import Link from 'next/link';
import { login, isAuthenticated } from '@/services/keycloak';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated: authState, isLoading } = useAuthStore();

  useEffect(() => {
    // Si ya está autenticado, redirigir al dashboard
    if (authState && !isLoading) {
      router.push('/dashboard');
    }
  }, [authState, isLoading, router]);

  const handleLogin = () => {
    login();
  };

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom>
            DUBSS
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
            Sistema de Gestión de Becas
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            UAGRM - Universidad Autónoma Gabriel René Moreno
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={handleLogin}
            sx={{ mt: 2 }}
          >
            Iniciar Sesión con Keycloak
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
            Ingrese con sus credenciales institucionales
          </Typography>

          <Divider sx={{ width: '100%', my: 3 }} />

          <Typography variant="body2" color="text.secondary" gutterBottom>
            ¿Eres estudiante y no tienes cuenta?
          </Typography>
          <Button
            component={Link}
            href="/register"
            variant="outlined"
            startIcon={<PersonAdd />}
            sx={{ mt: 1 }}
          >
            Registrarse como Estudiante
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
