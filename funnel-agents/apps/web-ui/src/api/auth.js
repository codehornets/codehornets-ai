/**
 * Authentication API client
 * Handles all authentication-related API calls
 *
 * This module supports both NestJS and Base44 backends.
 * When using NestJS (default), it uses the standard fetch API.
 * When using Base44, it uses the @base44/sdk axios client.
 */

const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'nestjs';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create auth client for NestJS backend
 */
const createNestJSAuthClient = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return {
    async post(path, data) {
      const response = await fetch(`${API_URL}/api/auth${path}`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.statusCode = response.status;
        throw error;
      }
      return response.json();
    },
    async get(path) {
      const response = await fetch(`${API_URL}/api/auth${path}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.statusCode = response.status;
        throw error;
      }
      return response.json();
    },
  };
};

/**
 * Create auth client - uses NestJS by default, Base44 if configured
 */
let createBase44AuthClient = null;

const createAuthClient = (token = null) => {
  if (BACKEND_MODE === 'base44') {
    // Lazy load Base44 client only when needed
    if (!createBase44AuthClient) {
      throw new Error('Base44 auth client not initialized. Call initBase44Auth() first.');
    }
    return createBase44AuthClient(token);
  }
  return createNestJSAuthClient(token);
};

/**
 * Initialize Base44 auth client (only call if using Base44 backend)
 */
export const initBase44Auth = async () => {
  if (BACKEND_MODE !== 'base44') return;

  const [{ createAxiosClient }, { appParams }] = await Promise.all([
    import('@base44/sdk/dist/utils/axios-client'),
    import('@/lib/app-params'),
  ]);

  createBase44AuthClient = (token = null) => {
    return createAxiosClient({
      baseURL: `${appParams.serverUrl}/api/auth`,
      headers: {
        'X-App-Id': appParams.appId,
        'Content-Type': 'application/json',
      },
      token,
      interceptResponses: true,
    });
  };
};

// Auto-initialize Base44 if needed
if (BACKEND_MODE === 'base44') {
  initBase44Auth().catch(err => {
    console.error('[Auth] Failed to initialize Base44 auth:', err);
  });
}

/**
 * Login with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} rememberMe - Remember user session (handled client-side for token storage)
 * @returns {Promise<{token: string, user: object, expires_in: number}>}
 */
export const login = async (email, password, rememberMe = false) => {
  const client = createAuthClient();

  try {
    // Note: remember_me is handled client-side for token storage duration
    // The backend LoginDto only accepts email and password
    const response = await client.post('/login', {
      email: email.toLowerCase().trim(),
      password
    });

    return response;
  } catch (error) {
    console.error('Login API error:', error);
    throw error;
  }
};

/**
 * Sign up a new user
 * @param {object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email
 * @param {string} userData.password - User's password
 * @param {string} [userData.company_name] - Optional company name
 * @returns {Promise<{token: string, user: object, expires_in: number}>}
 */
export const signup = async (userData) => {
  const client = createAuthClient();

  try {
    const response = await client.post('/signup', {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      password: userData.password,
      company_name: userData.company_name?.trim() || undefined
    });

    return response;
  } catch (error) {
    console.error('Signup API error:', error);
    throw error;
  }
};

/**
 * Get current authenticated user
 * @param {string} token - JWT token
 * @returns {Promise<object>} User object
 */
export const getCurrentUser = async (token) => {
  const client = createAuthClient(token);

  try {
    const response = await client.get('/me');
    return response;
  } catch (error) {
    console.error('Get current user API error:', error);
    throw error;
  }
};

/**
 * Refresh authentication token
 * @param {string} token - Current JWT token
 * @returns {Promise<{token: string, user: object, expires_in: number}>}
 */
export const refreshToken = async (token) => {
  const client = createAuthClient(token);

  try {
    const response = await client.post('/refresh');
    return response;
  } catch (error) {
    console.error('Refresh token API error:', error);
    throw error;
  }
};

/**
 * Logout user
 * @param {string} token - JWT token
 * @returns {Promise<void>}
 */
export const logout = async (token) => {
  const client = createAuthClient(token);

  try {
    await client.post('/logout');
  } catch (error) {
    console.warn('Logout API error (non-critical):', error);
    // Don't throw on logout errors - we still want to clear local state
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<{message: string}>}
 */
export const forgotPassword = async (email) => {
  const client = createAuthClient();

  try {
    const response = await client.post('/forgot-password', {
      email: email.toLowerCase().trim()
    });
    return response;
  } catch (error) {
    console.error('Forgot password API error:', error);
    throw error;
  }
};

/**
 * Reset password with token
 * @param {string} resetToken - Password reset token from email
 * @param {string} newPassword - New password
 * @returns {Promise<{message: string}>}
 */
export const resetPassword = async (resetToken, newPassword) => {
  const client = createAuthClient();

  try {
    const response = await client.post('/reset-password', {
      token: resetToken,
      password: newPassword
    });
    return response;
  } catch (error) {
    console.error('Reset password API error:', error);
    throw error;
  }
};

/**
 * Verify email with token
 * @param {string} verificationToken - Email verification token
 * @returns {Promise<{message: string}>}
 */
export const verifyEmail = async (verificationToken) => {
  const client = createAuthClient();

  try {
    const response = await client.post('/verify-email', {
      token: verificationToken
    });
    return response;
  } catch (error) {
    console.error('Verify email API error:', error);
    throw error;
  }
};

/**
 * Resend email verification
 * @param {string} email - User email
 * @returns {Promise<{message: string}>}
 */
export const resendVerification = async (email) => {
  const client = createAuthClient();

  try {
    const response = await client.post('/resend-verification', {
      email: email.toLowerCase().trim()
    });
    return response;
  } catch (error) {
    console.error('Resend verification API error:', error);
    throw error;
  }
};

export default {
  login,
  signup,
  getCurrentUser,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};
