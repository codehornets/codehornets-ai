import React, { createContext, useState, useContext, useEffect } from 'react';
import client, { isNestJS } from '@/api/client';

const AuthContext = createContext();

const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'nestjs';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create a simple fetch client for NestJS backend
 */
const createNestJSAppClient = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    async get(path) {
      const response = await fetch(`${API_URL}${path}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        const err = new Error(error.message || `HTTP ${response.status}`);
        err.status = response.status;
        err.data = error;
        throw err;
      }
      return response.json();
    },
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      if (isNestJS()) {
        // For NestJS backend, we skip the Base44 app public settings check
        // and go directly to user auth check
        const token = localStorage.getItem('access_token');
        if (token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        // Set default app settings for NestJS mode
        setAppPublicSettings({
          id: 'funnel-agents',
          public_settings: {
            app_name: import.meta.env.VITE_APP_NAME || 'FunnelAgents',
          },
        });
        setIsLoadingPublicSettings(false);
        return;
      }

      // Base44 backend - lazy load SDK
      const [{ createAxiosClient }, { appParams }] = await Promise.all([
        import('@base44/sdk/dist/utils/axios-client'),
        import('@/lib/app-params'),
      ]);

      const appClient = createAxiosClient({
        baseURL: `${appParams.serverUrl}/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId,
        },
        token: appParams.token,
        interceptResponses: true,
      });

      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);

        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);

        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required',
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app',
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message,
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app',
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred',
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await client.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required',
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (isNestJS()) {
      // For NestJS, clear local storage and optionally redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      if (shouldRedirect) {
        window.location.href = '/login';
      }
    } else {
      // Use the SDK's logout method which handles token cleanup and redirect
      if (shouldRedirect) {
        client.auth.logout(window.location.href);
      } else {
        client.auth.logout();
      }
    }
  };

  const navigateToLogin = () => {
    if (isNestJS()) {
      window.location.href = '/login';
    } else {
      // Use the SDK's redirectToLogin method
      client.auth.redirectToLogin(window.location.href);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
