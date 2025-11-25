/**
 * @fileoverview NestJS API Client for FunnelAgents
 *
 * Production-ready HTTP client that mimics Base44 SDK interface for seamless migration.
 * Handles JWT authentication, token refresh, request/response interceptors, and
 * provides entity-specific methods for all microservices.
 *
 * @module api/nestjsClient
 * @author FunnelAgents Development Team
 * @version 1.0.0
 */

/**
 * @typedef {Object} RequestConfig
 * @property {Object<string, string>} [headers] - Custom headers
 * @property {string} [method] - HTTP method
 * @property {any} [body] - Request body
 * @property {AbortSignal} [signal] - Abort signal for cancellation
 */

/**
 * @typedef {Object} QueryFilters
 * @property {number} [page] - Page number for pagination
 * @property {number} [limit] - Items per page
 * @property {string} [sort] - Sort field (prefix with - for descending)
 * @property {Object<string, any>} [where] - Filter conditions
 * @property {string[]} [fields] - Fields to include in response
 * @property {string[]} [populate] - Relations to populate
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {any[]} data - Array of items
 * @property {Object} meta - Pagination metadata
 * @property {number} meta.total - Total count
 * @property {number} meta.page - Current page
 * @property {number} meta.limit - Items per page
 * @property {number} meta.totalPages - Total pages
 */

/**
 * Token storage keys
 */
const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'nestjs_access_token',
  REFRESH_TOKEN: 'nestjs_refresh_token',
  TOKEN_EXPIRY: 'nestjs_token_expiry',
  USER_DATA: 'nestjs_user_data',
  CSRF_TOKEN: 'csrf_token',
};

/**
 * Microservice ports mapping
 */
const SERVICE_PORTS = {
  gateway: 3000,
  auth: 3001,
  crm: 3002,
  campaigns: 3003,
  content: 3004,
  agents: 3005,
  tasks: 3006,
  automations: 3007,
  reports: 3008,
};

/**
 * Main NestJS Client Class
 * Provides HTTP methods with automatic authentication and error handling
 */
class NestJSClient {
  /**
   * @param {Object} config - Client configuration
   * @param {string} [config.baseURL] - Base API URL (default: from env or localhost:3000)
   * @param {string} [config.wsURL] - WebSocket URL (default: from env or ws://localhost:3000)
   * @param {boolean} [config.enableLogging] - Enable request/response logging
   * @param {number} [config.timeout] - Request timeout in milliseconds
   */
  constructor(config = {}) {
    this.baseURL = config.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.wsURL = config.wsURL || import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
    this.enableLogging = config.enableLogging ?? import.meta.env.DEV;
    this.timeout = config.timeout || 30000;

    // Track refresh state to prevent multiple simultaneous refresh attempts
    this.isRefreshing = false;
    this.refreshSubscribers = [];

    // CSRF token management
    this.csrfToken = null;
    this.csrfFetchPromise = null;

    // Initialize entity services
    this.entities = this._initializeEntities();
    this.auth = this._initializeAuth();
    this.functions = this._initializeFunctions();
    this.integrations = this._initializeIntegrations();
  }

  /**
   * Log request/response for debugging
   * @private
   */
  _log(type, message, data) {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    const style = type === 'error' ? 'color: #ff4444' : 'color: #4CAF50';

    console.group(`%c[NestJS Client ${type.toUpperCase()}] ${timestamp}`, style);
    console.log(message, data);
    console.groupEnd();
  }

  /**
   * Get stored access token
   * @returns {string|null}
   */
  getAccessToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get stored refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Store authentication tokens
   * @param {string} accessToken - JWT access token
   * @param {string} refreshToken - JWT refresh token
   * @param {number} [expiresIn] - Token expiry in seconds
   */
  setTokens(accessToken, refreshToken, expiresIn = 3600) {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

    const expiryTime = Date.now() + (expiresIn * 1000);
    localStorage.setItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString());

    this._log('info', 'Tokens stored successfully', { expiresIn });
  }

  /**
   * Clear all stored authentication data
   */
  clearTokens() {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.CSRF_TOKEN);

    this.csrfToken = null;

    this._log('info', 'Tokens cleared');
  }

  /**
   * Check if token is expired or about to expire (within 5 minutes)
   * @returns {boolean}
   */
  isTokenExpired() {
    const expiry = localStorage.getItem(TOKEN_STORAGE_KEYS.TOKEN_EXPIRY);
    if (!expiry) return true;

    const expiryTime = parseInt(expiry, 10);
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    return Date.now() >= (expiryTime - bufferTime);
  }

  /**
   * Refresh access token using refresh token
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async _refreshToken() {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this._log('error', 'No refresh token available');
      return false;
    }

    try {
      this._log('info', 'Refreshing access token...');

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);

      this._log('info', 'Token refreshed successfully');
      return true;
    } catch (error) {
      this._log('error', 'Token refresh failed', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Add subscriber to wait for token refresh
   * @private
   */
  _subscribeToTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  /**
   * Notify all subscribers that token refresh completed
   * @private
   */
  _notifyTokenRefreshSubscribers(success, newToken) {
    this.refreshSubscribers.forEach(callback => callback(success, newToken));
    this.refreshSubscribers = [];
  }

  /**
   * Fetch CSRF token from the server
   * @returns {Promise<string>}
   * @private
   */
  async _fetchCsrfToken() {
    if (this.csrfFetchPromise) {
      return this.csrfFetchPromise;
    }

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(TOKEN_STORAGE_KEYS.CSRF_TOKEN);
      if (cached) {
        this.csrfToken = cached;
        return cached;
      }
    } catch (error) {
      this._log('warn', 'Failed to read CSRF token from localStorage', error);
    }

    this.csrfFetchPromise = (async () => {
      try {
        this._log('info', 'Fetching CSRF token...');

        const response = await fetch(`${this.baseURL}/api/security/csrf-token`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        const token = data.csrfToken;

        if (!token) {
          throw new Error('CSRF token not found in response');
        }

        this.csrfToken = token;

        // Cache in localStorage
        try {
          localStorage.setItem(TOKEN_STORAGE_KEYS.CSRF_TOKEN, token);
        } catch (error) {
          this._log('warn', 'Failed to cache CSRF token', error);
        }

        this._log('info', 'CSRF token fetched successfully');
        return token;
      } catch (error) {
        this._log('error', 'CSRF token fetch failed', error);
        throw error;
      } finally {
        this.csrfFetchPromise = null;
      }
    })();

    return this.csrfFetchPromise;
  }

  /**
   * Get CSRF token, fetching if needed
   * @returns {Promise<string|null>}
   * @private
   */
  async _getCsrfToken() {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      return await this._fetchCsrfToken();
    } catch (error) {
      this._log('warn', 'Could not get CSRF token, continuing without it', error);
      return null;
    }
  }

  /**
   * Initialize CSRF protection
   * Should be called on app startup
   * @returns {Promise<void>}
   */
  async initializeCsrf() {
    try {
      await this._fetchCsrfToken();
      this._log('info', 'CSRF protection initialized');
    } catch (error) {
      this._log('error', 'Failed to initialize CSRF protection', error);
      throw error;
    }
  }

  /**
   * Core HTTP request method with automatic auth and retry logic
   * @param {string} endpoint - API endpoint
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<any>}
   * @private
   */
  async _request(endpoint, config = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const accessToken = this.getAccessToken();

    // Check if token needs refresh before making request
    if (accessToken && this.isTokenExpired()) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        const refreshSuccess = await this._refreshToken();
        this.isRefreshing = false;
        this._notifyTokenRefreshSubscribers(refreshSuccess, this.getAccessToken());

        if (!refreshSuccess) {
          throw new Error('Authentication required - token refresh failed');
        }
      } else {
        // Wait for ongoing refresh to complete
        await new Promise((resolve) => {
          this._subscribeToTokenRefresh((success) => {
            resolve(success);
          });
        });
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add authorization header if token exists
    const currentToken = this.getAccessToken();
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }

    // Add CSRF token for state-changing requests (POST, PUT, PATCH, DELETE)
    const method = config.method || 'GET';
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      const csrfToken = await this._getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
        headers['CSRF-Token'] = csrfToken;
      }
    }

    const requestConfig = {
      method: config.method || 'GET',
      headers,
      ...config,
    };

    // Add body if present and not GET request
    if (config.body && requestConfig.method !== 'GET') {
      requestConfig.body = JSON.stringify(config.body);
    }

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    requestConfig.signal = config.signal || controller.signal;

    this._log('request', `${requestConfig.method} ${endpoint}`, { headers, body: config.body });

    try {
      const response = await fetch(url, requestConfig);
      clearTimeout(timeoutId);

      // Handle 401 Unauthorized - attempt token refresh
      if (response.status === 401 && !endpoint.includes('/auth/')) {
        this._log('info', '401 detected, attempting token refresh...');

        if (!this.isRefreshing) {
          this.isRefreshing = true;
          const refreshSuccess = await this._refreshToken();
          this.isRefreshing = false;
          this._notifyTokenRefreshSubscribers(refreshSuccess, this.getAccessToken());

          if (refreshSuccess) {
            // Retry original request with new token
            return this._request(endpoint, config);
          }
        } else {
          // Wait for ongoing refresh
          await new Promise((resolve) => {
            this._subscribeToTokenRefresh((success) => {
              if (success) {
                resolve(this._request(endpoint, config));
              } else {
                resolve(null);
              }
            });
          });
        }

        throw new Error('Authentication required');
      }

      // Handle other error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;

        this._log('error', `Request failed: ${response.status}`, errorData);
        throw error;
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      this._log('response', `${requestConfig.method} ${endpoint}`, data);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        this._log('error', 'Request timeout', { endpoint, timeout: this.timeout });
        throw new Error('Request timeout');
      }

      this._log('error', 'Request failed', { endpoint, error: error.message });
      throw error;
    }
  }

  /**
   * HTTP GET request
   * @param {string} endpoint - API endpoint
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<any>}
   */
  get(endpoint, config = {}) {
    return this._request(endpoint, { ...config, method: 'GET' });
  }

  /**
   * HTTP POST request
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<any>}
   */
  post(endpoint, body, config = {}) {
    return this._request(endpoint, { ...config, method: 'POST', body });
  }

  /**
   * HTTP PUT request
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<any>}
   */
  put(endpoint, body, config = {}) {
    return this._request(endpoint, { ...config, method: 'PUT', body });
  }

  /**
   * HTTP PATCH request
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<any>}
   */
  patch(endpoint, body, config = {}) {
    return this._request(endpoint, { ...config, method: 'PATCH', body });
  }

  /**
   * HTTP DELETE request
   * @param {string} endpoint - API endpoint
   * @param {RequestConfig} [config] - Request configuration
   * @returns {Promise<any>}
   */
  delete(endpoint, config = {}) {
    return this._request(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * Initialize authentication methods
   * @private
   * @returns {Object}
   */
  _initializeAuth() {
    return {
      /**
       * Login with email and password
       * @param {string} email - User email
       * @param {string} password - User password
       * @returns {Promise<Object>} User data and tokens
       */
      login: async (email, password) => {
        const data = await this.post('/api/auth/login', { email, password });
        // Handle both snake_case (backend) and camelCase responses
        const accessToken = data.access_token || data.accessToken;
        const refreshToken = data.refresh_token || data.refreshToken;
        const expiresIn = data.expires_in || data.expiresIn || 3600;
        this.setTokens(accessToken, refreshToken, expiresIn);
        localStorage.setItem(TOKEN_STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        // Return normalized response
        return { accessToken, refreshToken, expiresIn, user: data.user };
      },

      /**
       * Register new user
       * @param {Object} userData - User registration data
       * @returns {Promise<Object>}
       */
      register: async (userData) => {
        const data = await this.post('/api/auth/signup', userData);
        // Handle both snake_case (backend) and camelCase responses
        const accessToken = data.access_token || data.accessToken;
        const refreshToken = data.refresh_token || data.refreshToken;
        const expiresIn = data.expires_in || data.expiresIn || 3600;
        this.setTokens(accessToken, refreshToken, expiresIn);
        localStorage.setItem(TOKEN_STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        // Return normalized response
        return { accessToken, refreshToken, expiresIn, user: data.user };
      },

      /**
       * Logout current user
       * @returns {Promise<void>}
       */
      logout: async () => {
        try {
          await this.post('/api/auth/logout', { refreshToken: this.getRefreshToken() });
        } finally {
          this.clearTokens();
        }
      },

      /**
       * Get current user profile
       * @returns {Promise<Object>}
       */
      getCurrentUser: async () => {
        return this.get('/api/auth/me');
      },

      /**
       * Update user profile
       * @param {Object} updates - Profile updates
       * @returns {Promise<Object>}
       */
      updateProfile: async (updates) => {
        return this.patch('/api/auth/me', updates);
      },

      /**
       * Update current user (alias for updateProfile)
       * @param {Object} updates - Profile updates
       * @returns {Promise<Object>}
       */
      updateMe: async (updates) => {
        return this.patch('/api/auth/me', updates);
      },

      /**
       * Request password reset
       * @param {string} email - User email
       * @returns {Promise<Object>}
       */
      requestPasswordReset: async (email) => {
        return this.post('/api/auth/forgot-password', { email });
      },

      /**
       * Reset password with token
       * @param {string} token - Reset token
       * @param {string} newPassword - New password
       * @returns {Promise<Object>}
       */
      resetPassword: async (token, newPassword) => {
        return this.post('/api/auth/reset-password', { token, newPassword });
      },

      /**
       * Check if user is authenticated
       * @returns {Promise<boolean>}
       */
      isAuthenticated: async () => {
        return !!this.getAccessToken() && !this.isTokenExpired();
      },

      /**
       * Get current user profile (alias for getCurrentUser)
       * @returns {Promise<Object>}
       */
      me: async () => {
        return this.get('/api/auth/me');
      },

      /**
       * Redirect to login page
       * @param {string} [returnUrl] - URL to return to after login
       */
      redirectToLogin: (returnUrl) => {
        const loginPath = '/login';
        if (returnUrl) {
          const encodedReturnUrl = encodeURIComponent(returnUrl);
          window.location.href = `${loginPath}?returnUrl=${encodedReturnUrl}`;
        } else {
          window.location.href = loginPath;
        }
      },

      /**
       * Logout and optionally redirect
       * @param {string} [redirectUrl] - URL to redirect to after logout
       * @returns {Promise<void>}
       */
      logoutAndRedirect: async (redirectUrl) => {
        try {
          await this.post('/api/auth/logout', { refreshToken: this.getRefreshToken() });
        } finally {
          this.clearTokens();
          if (redirectUrl) {
            window.location.href = redirectUrl;
          }
        }
      },
    };
  }

  /**
   * Create entity service methods
   * @private
   * @param {string} entityName - Entity name (plural)
   * @param {string} [servicePath] - Custom service path
   * @returns {Object}
   */
  _createEntityService(entityName, servicePath) {
    const basePath = servicePath || `/${entityName}`;

    return {
      /**
       * List entities with optional filters
       * @param {QueryFilters} [filters] - Query filters
       * @returns {Promise<PaginatedResponse>}
       */
      list: async (filters = {}) => {
        const queryParams = new URLSearchParams();

        if (filters.page) queryParams.set('page', filters.page);
        if (filters.limit) queryParams.set('limit', filters.limit);
        if (filters.sort) queryParams.set('sort', filters.sort);
        if (filters.fields) queryParams.set('fields', filters.fields.join(','));
        if (filters.populate) queryParams.set('populate', filters.populate.join(','));
        if (filters.where) {
          Object.entries(filters.where).forEach(([key, value]) => {
            queryParams.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
          });
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `${basePath}?${queryString}` : basePath;

        return this.get(endpoint);
      },

      /**
       * Get entity by ID
       * @param {string|number} id - Entity ID
       * @param {Object} [options] - Query options
       * @param {string[]} [options.populate] - Relations to populate
       * @returns {Promise<Object>}
       */
      get: async (id, options = {}) => {
        const queryParams = new URLSearchParams();
        if (options.populate) queryParams.set('populate', options.populate.join(','));

        const queryString = queryParams.toString();
        const endpoint = queryString ? `${basePath}/${id}?${queryString}` : `${basePath}/${id}`;

        return this.get(endpoint);
      },

      /**
       * Create new entity
       * @param {Object} data - Entity data
       * @returns {Promise<Object>}
       */
      create: async (data) => {
        return this.post(basePath, data);
      },

      /**
       * Update entity by ID
       * @param {string|number} id - Entity ID
       * @param {Object} data - Update data
       * @returns {Promise<Object>}
       */
      update: async (id, data) => {
        return this.patch(`${basePath}/${id}`, data);
      },

      /**
       * Delete entity by ID
       * @param {string|number} id - Entity ID
       * @returns {Promise<void>}
       */
      delete: async (id) => {
        return this.delete(`${basePath}/${id}`);
      },

      /**
       * Advanced query with filters
       * @param {QueryFilters} filters - Query filters
       * @returns {Promise<PaginatedResponse>}
       */
      query: async (filters) => {
        return this.list(filters);
      },

      /**
       * Bulk create entities
       * @param {Object[]} items - Array of entities to create
       * @returns {Promise<Object[]>}
       */
      bulkCreate: async (items) => {
        return this.post(`${basePath}/bulk`, { items });
      },

      /**
       * Bulk update entities
       * @param {Object[]} updates - Array of updates with ids
       * @returns {Promise<Object[]>}
       */
      bulkUpdate: async (updates) => {
        return this.patch(`${basePath}/bulk`, { updates });
      },

      /**
       * Bulk delete entities
       * @param {string[]|number[]} ids - Array of entity IDs
       * @returns {Promise<Object>}
       */
      bulkDelete: async (ids) => {
        return this.delete(`${basePath}/bulk`, { body: { ids } });
      },
    };
  }

  /**
   * Initialize all entity services
   * @private
   * @returns {Object}
   */
  _initializeEntities() {
    return {
      leads: this._createEntityService('leads', '/api/leads'),
      contacts: this._createEntityService('contacts', '/api/contacts'),
      companies: this._createEntityService('companies', '/api/companies'),
      deals: this._createEntityService('deals', '/api/deals'),
      tasks: this._createEntityService('tasks', '/api/tasks'),
      campaigns: this._createEntityService('campaigns', '/api/campaigns'),
      content: this._createEntityService('content', '/api/content'),
      agents: this._createEntityService('agents', '/api/agents'),
      Agent: this._createEntityService('agents', '/api/agents'), // Alias for consistency
      workflows: this._createEntityService('workflows', '/api/workflows'),
      automations: this._createEntityService('automations', '/api/automations'),
      reports: this._createEntityService('reports', '/api/reports'),
      templates: this._createEntityService('templates', '/api/templates'),
      sequences: this._createEntityService('sequences', '/api/sequences'),
      // Agent-specific entities
      AgentTemplate: this._createEntityService('agent-templates', '/api/agents/templates'),
      AgentTemplateCategory: this._createEntityService('agent-template-categories', '/api/agents/template-categories'),
      AgentFeedback: this._createEntityService('agent-feedback', '/api/agents/feedback'),
      AgentPerformanceTuning: this._createEntityService('agent-tuning', '/api/agents/tuning'),
      ClientFeedback: this._createEntityService('client-feedback', '/api/client-feedback'),
      // Additional common entities
      Task: this._createEntityService('tasks', '/api/tasks'),
      Project: this._createEntityService('projects', '/api/projects'),
      Workspace: this._createEntityService('workspaces', '/api/workspaces'),
      workspaces: this._createEntityService('workspaces', '/api/workspaces'),
    };
  }

  /**
   * Initialize functions/serverless invocation methods
   * @private
   * @returns {Object}
   */
  _initializeFunctions() {
    return {
      /**
       * Invoke a serverless function
       * @param {string} functionName - Function name
       * @param {Object} params - Function parameters
       * @returns {Promise<Object>}
       */
      invoke: async (functionName, params = {}) => {
        return this.post(`/functions/${functionName}`, params);
      },
    };
  }

  /**
   * Initialize integration methods
   * @private
   * @returns {Object}
   */
  _initializeIntegrations() {
    return {
      Core: {
        /**
         * Invoke LLM for AI operations
         * @param {Object} params - LLM parameters
         * @param {string} params.model - Model name
         * @param {string} params.prompt - Input prompt
         * @param {Object} [params.options] - Additional options
         * @returns {Promise<Object>}
         */
        InvokeLLM: async (params) => {
          return this.post('/integrations/llm/invoke', params);
        },

        /**
         * Send email
         * @param {Object} params - Email parameters
         * @param {string} params.to - Recipient email
         * @param {string} params.subject - Email subject
         * @param {string} params.body - Email body
         * @param {string} [params.from] - Sender email
         * @returns {Promise<Object>}
         */
        SendEmail: async (params) => {
          return this.post('/integrations/email/send', params);
        },

        /**
         * Send SMS
         * @param {Object} params - SMS parameters
         * @param {string} params.to - Recipient phone number
         * @param {string} params.message - SMS message
         * @returns {Promise<Object>}
         */
        SendSMS: async (params) => {
          return this.post('/integrations/sms/send', params);
        },

        /**
         * Upload file
         * @param {File} file - File to upload
         * @param {Object} [metadata] - File metadata
         * @returns {Promise<Object>}
         */
        UploadFile: async (file, metadata = {}) => {
          const formData = new FormData();
          formData.append('file', file);
          Object.entries(metadata).forEach(([key, value]) => {
            formData.append(key, value);
          });

          return this._request('/integrations/files/upload', {
            method: 'POST',
            body: formData,
            headers: {}, // Let browser set Content-Type for FormData
          });
        },

        /**
         * Generate image using AI
         * @param {Object} params - Image generation parameters
         * @param {string} params.prompt - Image prompt
         * @param {Object} [params.options] - Generation options
         * @returns {Promise<Object>}
         */
        GenerateImage: async (params) => {
          return this.post('/integrations/ai/generate-image', params);
        },

        /**
         * Extract data from uploaded file
         * @param {string} fileId - Uploaded file ID
         * @param {Object} [options] - Extraction options
         * @returns {Promise<Object>}
         */
        ExtractDataFromUploadedFile: async (fileId, options = {}) => {
          return this.post('/integrations/files/extract', { fileId, ...options });
        },
      },
    };
  }
}

/**
 * Create and export singleton instance
 */
const nestjsClient = new NestJSClient();

export default nestjsClient;
export { NestJSClient };
