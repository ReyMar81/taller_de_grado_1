/**
 * Cliente HTTP configurado con axios
 */
import axios from 'axios';
import { getToken } from './keycloak';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request - Adding token:', token.substring(0, 50) + '...');
    } else {
      console.log('API Request - No token available');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejo de errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      console.error('No autorizado - redirigiendo al login');
      // Aquí puedes agregar lógica para redirigir al login
    }
    return Promise.reject(error);
  }
);

export default apiClient;
