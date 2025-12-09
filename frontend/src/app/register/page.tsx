'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import { School, ArrowForward, CheckCircle, ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import axios from 'axios';

interface StudentData {
  nombre: string;
  ci: string;
  lugar_ci: string;
  fecha_nac: string;
  direccion: string;
  telefono: string;
  tel_celular: string;
  sexo: string;
  des_carrera: string;
  facultad: string;
  activo: string;
}

export default function RegisterPage() {
  // Estado del formulario - Paso 1: Validación RU
  const [registroUniversitario, setRegistroUniversitario] = useState('');
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [validationError, setValidationError] = useState('');

  // Estado del formulario - Paso 2: Registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const handleValidateRU = async () => {
    setValidationError('');
    setValidating(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/validate-student/`,
        { registro_universitario: registroUniversitario }
      );

      if (response.data.success) {
        setStudentData(response.data.data);
        setValidated(true);
      } else {
        setValidationError(response.data.message);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setValidationError(error.response.data.message);
      } else if (error.response?.status === 404) {
        setValidationError('Registro universitario no encontrado en el sistema institucional');
      } else {
        setValidationError('Error al validar el registro. Intente nuevamente.');
      }
    } finally {
      setValidating(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    // Validaciones básicas
    if (!email) {
      setRegisterError('El correo electrónico es obligatorio');
      return;
    }

    if (!password || password.length < 8) {
      setRegisterError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError('Las contraseñas no coinciden');
      return;
    }

    setRegistering(true);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register/`,
        {
          registro_universitario: registroUniversitario,
          email,
          password,
          confirm_password: confirmPassword,
        }
      );

      if (response.data.success) {
        setRegisterSuccess(true);
      } else {
        setRegisterError(response.data.message);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        setRegisterError(error.response.data.message);
      } else if (error.response?.data) {
        // Errores de validación del backend
        const errors = error.response.data;
        const errorMessages = Object.values(errors).flat().join('. ');
        setRegisterError(errorMessages || 'Error al registrar. Verifique los datos.');
      } else {
        setRegisterError('Error al registrar. Intente nuevamente.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleReset = () => {
    setValidated(false);
    setStudentData(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRegisterError('');
  };

  if (registerSuccess) {
    return (
      <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
        {/* Header */}
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

        <Container maxWidth="sm">
          <Box sx={{ minHeight: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', py: 4 }}>
            <Paper elevation={3} sx={{ p: 5, width: '100%', textAlign: 'center', borderRadius: 3 }}>
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: '#C62828',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}
              >
                <CheckCircle sx={{ fontSize: 60, color: 'white' }} />
              </Box>
              <Typography variant="h4" gutterBottom sx={{ color: '#003D82', fontWeight: 700 }}>
                ¡Registro Exitoso!
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 1 }}>
                Tu cuenta ha sido creada correctamente.
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 4 }}>
                Ya puedes iniciar sesión con tu registro universitario y contraseña.
              </Typography>
              <Button
                component={Link}
                href="/login"
                variant="contained"
                size="large"
                sx={{ 
                  mt: 2,
                  bgcolor: '#C62828',
                  '&:hover': { bgcolor: '#8E0000' },
                  py: 1.5,
                  px: 4
                }}
              >
                Ir al Login
              </Button>
            </Paper>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F5F5F5', minHeight: '100vh' }}>
      {/* Header */}
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

      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
            {/* Título y botón de regresar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box 
                sx={{ 
                  width: 50, 
                  height: 50, 
                  bgcolor: '#C62828', 
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <School sx={{ fontSize: 28, color: 'white' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#003D82' }}>
                  Registro de Estudiante
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Sistema de Gestión de Becas - UAGRM
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/login"
                startIcon={<ArrowBack />}
                sx={{ 
                  color: '#C62828',
                  '&:hover': { bgcolor: 'rgba(198, 40, 40, 0.04)' }
                }}
              >
                Volver
              </Button>
            </Box>

          {!validated ? (
            // Paso 1: Validación de Registro Universitario
            <Box>
              <Box sx={{ bgcolor: '#003D82', p: 3, borderRadius: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                  Paso 1: Validar Registro Universitario
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Ingresa tu registro universitario para validar tus datos institucionales
                </Typography>
              </Box>

              {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationError}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Registro Universitario"
                value={registroUniversitario}
                onChange={(e) => setRegistroUniversitario(e.target.value)}
                placeholder="Ej: 220001"
                disabled={validating}
                sx={{ mb: 3 }}
                onKeyPress={(e) => e.key === 'Enter' && handleValidateRU()}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleValidateRU}
                disabled={!registroUniversitario || validating}
                endIcon={validating ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <ArrowForward />}
                sx={{ 
                  py: 1.5,
                  bgcolor: '#C62828',
                  '&:hover': { bgcolor: '#8E0000' },
                  '&:disabled': { bgcolor: '#ccc' }
                }}
              >
                {validating ? 'Validando...' : 'Validar Registro'}
              </Button>
            </Box>
          ) : (
            // Paso 2: Formulario de Registro Completo
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ bgcolor: '#003D82', px: 3, py: 1.5, borderRadius: 2, flex: 1 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                    Paso 2: Completar Registro
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  onClick={handleReset}
                  sx={{ 
                    ml: 2,
                    color: '#C62828',
                    border: '1px solid #C62828',
                    '&:hover': { bgcolor: 'rgba(198, 40, 40, 0.04)' }
                  }}
                >
                  Cambiar RU
                </Button>
              </Box>

              {registerError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {registerError}
                </Alert>
              )}

              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3,
                  bgcolor: 'rgba(102, 187, 106, 0.1)',
                  '& .MuiAlert-icon': { color: '#66BB6A' }
                }}
              >
                Los datos institucionales se han validado correctamente
              </Alert>

              {/* Datos Institucionales (Read-only) */}
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  fontWeight: 600, 
                  color: '#003D82',
                  borderLeft: '4px solid #C62828',
                  pl: 2
                }}
              >
                Datos Institucionales
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Registro Universitario"
                    value={registroUniversitario}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre Completo"
                    value={studentData?.nombre || ''}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Carnet de Identidad"
                    value={`${studentData?.ci} ${studentData?.lugar_ci}`}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fecha de Nacimiento"
                    value={studentData?.fecha_nac || ''}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Carrera"
                    value={studentData?.des_carrera || ''}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Facultad"
                    value={studentData?.facultad || ''}
                    InputProps={{ readOnly: true }}
                    variant="filled"
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Formulario de Credenciales */}
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600, 
                  color: '#003D82',
                  borderLeft: '4px solid #C62828',
                  pl: 2
                }}
              >
                Credenciales de Acceso
              </Typography>
              <form onSubmit={handleRegister}>
                <TextField
                  fullWidth
                  label="Correo Electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  helperText="Correo válido para recibir notificaciones"
                />
                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  helperText="Mínimo 8 caracteres"
                />
                <TextField
                  fullWidth
                  label="Confirmar Contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={registering}
                  endIcon={registering ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckCircle />}
                  sx={{ 
                    py: 1.5,
                    bgcolor: '#C62828',
                    '&:hover': { bgcolor: '#8E0000' },
                    '&:disabled': { bgcolor: '#ccc' }
                  }}
                >
                  {registering ? 'Registrando...' : 'Completar Registro'}
                </Button>
              </form>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            ¿Ya tienes cuenta?{' '}
            <MuiLink 
              component={Link} 
              href="/login" 
              underline="hover"
              sx={{ color: '#C62828', fontWeight: 600 }}
            >
              Inicia sesión aquí
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Container>
    </Box>
  );
}
