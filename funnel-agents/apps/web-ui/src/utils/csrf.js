/**
 * @fileoverview CSRF Token Management
 *
 * Handles CSRF token fetching, storage, and injection into requests.
 * Must be initialized on app startup before making any state-changing requests.
 *
 * @module utils/csrf
 */

/**
 * CSRF Token storage key
 */
const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';

/**
 * Token cache duration (30 minutes)
 */
const TOKEN_CACHE_DURATION = 30 * 60 * 1000;

/**
 * In-memory token storage (fallback if localStorage fails)
 */
let memoryToken = null;

/**
 * CSRF Token Manager Class
 */
class CsrfTokenManager {
  constructor() {
    this.token = null;
    this.fetchPromise = null;
    this.initialized = false;
  }

  /**
   * Get stored CSRF token from localStorage or memory
   * @private
   * @returns {string|null}
   */
  _getStoredToken() {
    try {
      const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
      if (expiry && Date.now() < parseInt(expiry, 10)) {
        return localStorage.getItem(CSRF_TOKEN_KEY);
      }
      // Token expired, clear it
      this._clearStoredToken();
      return null;
    } catch (error) {
      console.warn('CSRF: localStorage access failed, using memory storage', error);
      return memoryToken;
    }
  }

  /**
   * Store CSRF token in localStorage and memory
   * @private
   * @param {string} token
   */
  _storeToken(token) {
    this.token = token;
    memoryToken = token;

    try {
      localStorage.setItem(CSRF_TOKEN_KEY, token);
      localStorage.setItem(
        CSRF_TOKEN_EXPIRY_KEY,
        (Date.now() + TOKEN_CACHE_DURATION).toString()
      );
    } catch (error) {
      console.warn('CSRF: Failed to store token in localStorage', error);
    }
  }

  /**
   * Clear stored CSRF token
   * @private
   */
  _clearStoredToken() {
    this.token = null;
    memoryToken = null;

    try {
      localStorage.removeItem(CSRF_TOKEN_KEY);
      localStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.warn('CSRF: Failed to clear token from localStorage', error);
    }
  }

  /**
   * Fetch CSRF token from the server
   *
   * @param {string} baseURL - API base URL
   * @returns {Promise<string>} CSRF token
   */
  async fetchToken(baseURL = 'http://localhost:3000') {
    // If already fetching, return the existing promise
    if (this.fetchPromise) {
      return this.fetchPromise;
    }

    // Check if we have a valid cached token
    const cachedToken = this._getStoredToken();
    if (cachedToken) {
      this.token = cachedToken;
      this.initialized = true;
      return cachedToken;
    }

    // Fetch new token from server
    this.fetchPromise = (async () => {
      try {
        const response = await fetch(`${baseURL}/api/security/csrf-token`, {
          method: 'GET',
          credentials: 'include', // Important: include cookies
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.status}`);
        }

        const data = await response.json();
        const token = data.csrfToken;

        if (!token) {
          throw new Error('CSRF token not found in response');
        }

        this._storeToken(token);
        this.initialized = true;

        console.log('CSRF token fetched and stored successfully');
        return token;
      } catch (error) {
        console.error('CSRF: Failed to fetch token', error);
        throw error;
      } finally {
        this.fetchPromise = null;
      }
    })();

    return this.fetchPromise;
  }

  /**
   * Get current CSRF token
   * If token doesn't exist, fetches it from the server
   *
   * @param {string} baseURL - API base URL
   * @returns {Promise<string>} CSRF token
   */
  async getToken(baseURL) {
    if (this.token) {
      return this.token;
    }

    // Check cache first
    const cachedToken = this._getStoredToken();
    if (cachedToken) {
      this.token = cachedToken;
      return cachedToken;
    }

    // Fetch new token
    return this.fetchToken(baseURL);
  }

  /**
   * Refresh CSRF token (force fetch new token)
   *
   * @param {string} baseURL - API base URL
   * @returns {Promise<string>} New CSRF token
   */
  async refreshToken(baseURL) {
    this._clearStoredToken();
    return this.fetchToken(baseURL);
  }

  /**
   * Check if CSRF manager is initialized
   *
   * @returns {boolean}
   */
  isInitialized() {
    return this.initialized && !!this.token;
  }

  /**
   * Clear token (used on logout)
   */
  clearToken() {
    this._clearStoredToken();
    this.initialized = false;
  }
}

// Singleton instance
const csrfManager = new CsrfTokenManager();

/**
 * Initialize CSRF protection by fetching the token
 * Should be called on app startup
 *
 * @param {string} baseURL - API base URL
 * @returns {Promise<void>}
 *
 * @example
 * // In your app initialization (main.jsx or App.jsx)
 * import { initializeCsrf } from './utils/csrf';
 *
 * async function initApp() {
 *   await initializeCsrf('http://localhost:3000');
 *   // Now safe to make state-changing requests
 * }
 */
export async function initializeCsrf(baseURL = 'http://localhost:3000') {
  try {
    await csrfManager.fetchToken(baseURL);
    console.log('CSRF protection initialized');
  } catch (error) {
    console.error('Failed to initialize CSRF protection', error);
    throw error;
  }
}

/**
 * Get CSRF token
 *
 * @param {string} baseURL - API base URL
 * @returns {Promise<string>} CSRF token
 *
 * @example
 * const token = await getCsrfToken();
 */
export async function getCsrfToken(baseURL) {
  return csrfManager.getToken(baseURL);
}

/**
 * Refresh CSRF token
 *
 * @param {string} baseURL - API base URL
 * @returns {Promise<string>} New CSRF token
 */
export async function refreshCsrfToken(baseURL) {
  return csrfManager.refreshToken(baseURL);
}

/**
 * Check if CSRF is initialized
 *
 * @returns {boolean}
 */
export function isCsrfInitialized() {
  return csrfManager.isInitialized();
}

/**
 * Clear CSRF token (call on logout)
 */
export function clearCsrfToken() {
  csrfManager.clearToken();
}

/**
 * Get CSRF headers object for fetch requests
 *
 * @param {string} baseURL - API base URL
 * @returns {Promise<Object>} Headers object with CSRF token
 *
 * @example
 * const headers = await getCsrfHeaders();
 * fetch('/api/endpoint', {
 *   method: 'POST',
 *   headers: { ...headers, 'Content-Type': 'application/json' },
 *   body: JSON.stringify(data)
 * });
 */
export async function getCsrfHeaders(baseURL) {
  const token = await csrfManager.getToken(baseURL);
  return {
    'X-CSRF-Token': token,
    'CSRF-Token': token,
  };
}

/**
 * Export the manager instance for advanced usage
 */
export default csrfManager;
