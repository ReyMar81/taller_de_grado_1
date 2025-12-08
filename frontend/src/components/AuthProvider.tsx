/**
 * Provider de autenticación que inicializa Keycloak
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initKeycloak, isAuthenticated, getToken } from '@/services/keycloak';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/services/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setLoading, setError, setAuthenticated, setToken } = useAuthStore();
  const [initStarted, setInitStarted] = useState(false);

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get('/users/usuarios/me/');
      const token = getToken();
      
      setUser(response.data);
      setToken(token || null);
      setAuthenticated(true);
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      setError('Error al obtener información del usuario');
      setAuthenticated(false);
      setToken(null);
    }
  };

  useEffect(() => {
    // Evitar múltiples inicializaciones en StrictMode
    if (initStarted) {
      return;
    }

    setInitStarted(true);

    const init = async () => {
      try {
        setLoading(true);
        
        await initKeycloak(() => {
          // Callback cuando está autenticado
          fetchUserInfo();
        });

        if (!isAuthenticated()) {
          setAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        setError('Error al inicializar la autenticación');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return <>{children}</>;
}
