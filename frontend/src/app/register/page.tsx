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
import { School, ArrowForward, CheckCircle } from '@mui/icons-material';
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
      <Container maxWidth="sm">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', py: 4 }}>
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <CheckCircle color="success" sx={{ fontSize: 80, mb: 2 }} />
            <Typography variant="h4" gutterBottom color="success.main">
              ¡Registro Exitoso!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Tu cuenta ha sido creada correctamente.
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ya puedes iniciar sesión con tu registro universitario y contraseña.
            </Typography>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
            >
              Ir al Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ minHeight: '100vh', py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <School sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                Registro de Estudiante
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sistema de Gestión de Becas - UAGRM
              </Typography>
            </Box>
          </Box>

          {!validated ? (
            // Paso 1: Validación de Registro Universitario
            <Box>
              <Typography variant="h6" gutterBottom>
                Paso 1: Validar Registro Universitario
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ingresa tu registro universitario para validar tus datos institucionales
              </Typography>

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
                sx={{ mb: 2 }}
                onKeyPress={(e) => e.key === 'Enter' && handleValidateRU()}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleValidateRU}
                disabled={!registroUniversitario || validating}
                endIcon={validating ? <CircularProgress size={20} /> : <ArrowForward />}
              >
                {validating ? 'Validando...' : 'Validar Registro'}
              </Button>
            </Box>
          ) : (
            // Paso 2: Formulario de Registro Completo
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Paso 2: Completar Registro
                </Typography>
                <Button size="small" onClick={handleReset}>
                  Cambiar RU
                </Button>
              </Box>

              {registerError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {registerError}
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 3 }}>
                Los datos institucionales se han validado correctamente
              </Alert>

              {/* Datos Institucionales (Read-only) */}
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
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
              <Typography variant="subtitle2" gutterBottom>
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
                  endIcon={registering ? <CircularProgress size={20} /> : <CheckCircle />}
                >
                  {registering ? 'Registrando...' : 'Completar Registro'}
                </Button>
              </form>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" color="text.secondary" align="center">
            ¿Ya tienes cuenta?{' '}
            <MuiLink component={Link} href="/login" underline="hover">
              Inicia sesión aquí
            </MuiLink>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
