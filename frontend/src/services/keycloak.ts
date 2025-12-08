/**
 * Servicio de autenticación con Keycloak
 */
import Keycloak from 'keycloak-js';

const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'dubss',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'dubss-frontend',
};

let keycloakInstance: Keycloak | null = null;
let initPromise: Promise<boolean> | null = null;

export const getKeycloak = (): Keycloak => {
  if (!keycloakInstance) {
    keycloakInstance = new Keycloak(keycloakConfig);
  }
  return keycloakInstance;
};

export const initKeycloak = async (onAuthenticatedCallback: () => void): Promise<boolean> => {
  // Si ya hay una inicialización en curso, esperar a que termine
  if (initPromise) {
    return initPromise;
  }

  const keycloak = getKeycloak();
  
  // Si ya está inicializado, solo ejecutar el callback si está autenticado
  if (keycloak.authenticated !== undefined) {
    console.log('Keycloak already initialized. Authenticated:', keycloak.authenticated);
    if (keycloak.authenticated) {
      onAuthenticatedCallback();
    }
    return keycloak.authenticated;
  }

  initPromise = (async () => {
    try {
      const authenticated = await keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      });

      console.log('Keycloak initialized. Authenticated:', authenticated);
      
      if (authenticated) {
        console.log('User is authenticated. Token:', keycloak.token?.substring(0, 50) + '...');
        onAuthenticatedCallback();
      } else {
        console.log('User is not authenticated');
      }

      // Configurar actualización automática del token
      keycloak.onTokenExpired = () => {
        console.log('Token expired, refreshing...');
        keycloak.updateToken(70).catch(() => {
          console.error('Failed to refresh token');
          keycloak.logout();
        });
      };

      return authenticated;
    } catch (error) {
      console.error('Error inicializando Keycloak:', error);
      initPromise = null; // Resetear para permitir reintentos
      return false;
    }
  })();

  return initPromise;
};

export const login = () => {
  const keycloak = getKeycloak();
  keycloak.login({
    redirectUri: window.location.origin + '/dashboard'
  });
};

export const logout = () => {
  const keycloak = getKeycloak();
  keycloak.logout({
    redirectUri: window.location.origin + '/login'
  });
};

export const getToken = (): string | undefined => {
  const keycloak = getKeycloak();
  return keycloak.token;
};

export const isAuthenticated = (): boolean => {
  const keycloak = getKeycloak();
  return keycloak.authenticated || false;
};

export const getUserInfo = () => {
  const keycloak = getKeycloak();
  return keycloak.tokenParsed;
};
