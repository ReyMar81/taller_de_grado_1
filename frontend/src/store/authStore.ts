/**
 * Store global de autenticación usando Zustand
 */
import { create } from 'zustand';

export interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  rol_display: string;
  telefono?: string;
  perfil_estudiante?: {
    registro_universitario: string;
    facultad: string;
    carrera: string;
  };
  perfil_institucional?: {
    unidad: string;
    cargo: string;
  };
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
  error: null,
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  logout: () => set({ isAuthenticated: false, user: null, token: null, error: null }),
}));
