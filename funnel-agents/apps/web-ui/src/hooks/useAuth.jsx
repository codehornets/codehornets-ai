import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { appParams } from '@/lib/app-params';
import client from '@/api/client';

const AuthContext = createContext(null);

// Use the same storage keys as nestjsClient for consistency
const TOKEN_STORAGE_KEY = 'nestjs_access_token';
const REFRESH_TOKEN_KEY = 'nestjs_refresh_token';
const USER_STORAGE_KEY = 'nestjs_user_data';
const TOKEN_EXPIRY_KEY = 'nestjs_token_expiry';
const REFRESH_THRESHOLD = 5 * 60 * 1000; // Refresh token 5 minutes before expiry

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const refreshTimerRef = useRef(null);

  // Initialize authentication state from localStorage
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up automatic token refresh
  useEffect(() => {
    if (isAuthenticated) {
      scheduleTokenRefresh();
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [isAuthenticated]);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (storedToken && storedUser) {
        // Check if token is expired
        if (tokenExpiry && new Date(tokenExpiry) > new Date()) {
          // Update appParams with stored token
          appParams.token = storedToken;

          // Verify token is still valid by fetching current user
          try {
            const currentUser = await client.auth.getCurrentUser();
            setUser(currentUser);
            setIsAuthenticated(true);
            setAuthError(null);
          } catch (error) {
            console.error('Token validation failed:', error);
            // Token is invalid, clear auth state
            clearAuthState();
          }
        } else {
          // Token expired - clear state and require re-login
          console.warn('[Auth] Token expired during initialization, clearing state');
          clearAuthState();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const scheduleTokenRefresh = () => {
    const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Don't schedule refresh if we don't have a refresh token
    if (!tokenExpiry || !storedRefreshToken) {
      console.warn('[Auth] No refresh token available, skipping automatic refresh');
      return;
    }

    const expiryTime = new Date(tokenExpiry).getTime();
    const currentTime = new Date().getTime();
    const timeUntilRefresh = expiryTime - currentTime - REFRESH_THRESHOLD;

    // If token is already expired or about to expire, just clear state and require re-login
    if (timeUntilRefresh < 0) {
      console.warn('[Auth] Token expired, requiring re-login');
      clearAuthState();
      return;
    }

    if (timeUntilRefresh > 0) {
      refreshTimerRef.current = setTimeout(() => {
        refreshToken().catch(error => {
          console.error('Automatic token refresh failed:', error);
          handleAuthError(error);
        });
      }, timeUntilRefresh);
    }
  };

  const storeAuthData = (accessToken, refreshToken, userData, expiresIn = 3600) => {
    // Use nestjsClient's setTokens method to ensure consistency
    client.setTokens(accessToken, refreshToken, expiresIn);
    
    // Store user data
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

    // Update appParams
    appParams.token = accessToken;
  };

  const clearAuthState = () => {
    // Use nestjsClient's clearTokens method to ensure consistency
    client.clearTokens();

    setUser(null);
    setIsAuthenticated(false);
    appParams.token = null;

    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  };

  const handleAuthError = (error) => {
    if (error.status === 401 || error.status === 403) {
      setAuthError({
        type: 'auth_required',
        message: 'Your session has expired. Please sign in again.'
      });
      clearAuthState();
    } else {
      setAuthError({
        type: 'unknown',
        message: error.message || 'An authentication error occurred'
      });
    }
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Call login API using nestjsClient
      const response = await client.auth.login(email, password);

      const { accessToken, refreshToken, user: userData, expiresIn } = response;

      // Store authentication data
      storeAuthData(accessToken, refreshToken, userData, expiresIn);

      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      console.error('Login error:', error);
      setAuthError({
        type: 'login_failed',
        message: error.message || 'Login failed'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData) => {
    try {
      setIsLoading(true);
      setAuthError(null);

      // Call signup API using nestjsClient
      const response = await client.auth.register(signupData);

      const { accessToken, refreshToken, user: userData, expiresIn } = response;

      // Store authentication data
      storeAuthData(accessToken, refreshToken, userData, expiresIn);

      setUser(userData);
      setIsAuthenticated(true);

      return userData;
    } catch (error) {
      console.error('Signup error:', error);
      setAuthError({
        type: 'signup_failed',
        message: error.message || 'Signup failed'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const currentRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (!currentRefreshToken) {
        console.warn('[Auth] No refresh token available, clearing auth state');
        clearAuthState();
        throw new Error('No refresh token available');
      }

      // nestjsClient handles refresh internally
      const success = await client._refreshToken();

      if (!success) {
        throw new Error('Token refresh failed');
      }

      // Get updated user data
      const userData = await client.auth.getCurrentUser();
      setUser(userData);
      setIsAuthenticated(true);

      return client.getAccessToken();
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthState();
      throw error;
    }
  };

  const logout = useCallback(async (shouldRedirect = true) => {
    try {
      // Call logout API to invalidate token server-side
      await client.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local auth state
      clearAuthState();

      if (shouldRedirect) {
        // Redirect to login page
        window.location.href = '/Login';
      }
    }
  }, []);

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    authError,
    login,
    signup,
    logout,
    refreshToken,
    updateUser,
    clearAuthState
  };

  return (
    <AuthContext.Provider value={value}>
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

export default useAuth;
