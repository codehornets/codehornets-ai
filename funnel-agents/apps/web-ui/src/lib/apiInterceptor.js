/**
 * @fileoverview API Interceptor for Error Tracking and Performance Monitoring
 *
 * Automatically tracks API calls, errors, and performance metrics.
 * Integrates with Sentry and error logger.
 *
 * @module lib/apiInterceptor
 * @author FunnelAgents Development Team
 * @version 1.0.0
 */

import { addBreadcrumb } from '@/lib/sentry';
import { logApiError, logDebug, LogCategory } from '@/utils/errorLogger';
import { measureApiCall } from '@/lib/performanceMonitoring';

/**
 * Create fetch wrapper with error tracking and performance monitoring
 *
 * @param {Function} originalFetch - Original fetch function
 * @returns {Function} Wrapped fetch function
 */
export function createTrackedFetch(originalFetch = window.fetch) {
  return async function trackedFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const startTime = performance.now();

    // Parse URL
    const urlString = typeof url === 'string' ? url : url.toString();
    const urlObj = new URL(urlString, window.location.origin);
    const endpoint = urlObj.pathname;

    // Add breadcrumb for request
    addBreadcrumb({
      category: 'api',
      message: `API Request: ${method} ${endpoint}`,
      level: 'info',
      data: {
        method,
        endpoint,
        url: urlString,
      },
    });

    try {
      // Make the actual request
      const response = await originalFetch(url, options);
      const duration = performance.now() - startTime;

      // Log successful request
      logDebug(`API ${method} ${endpoint} - ${response.status}`, {
        category: LogCategory.API,
        extra: {
          method,
          endpoint,
          status: response.status,
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      // Add breadcrumb for response
      addBreadcrumb({
        category: 'api',
        message: `API Response: ${method} ${endpoint} - ${response.status}`,
        level: response.ok ? 'info' : 'warning',
        data: {
          method,
          endpoint,
          status: response.status,
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      // Track error responses
      if (!response.ok) {
        // Clone response to read body without consuming it
        const clonedResponse = response.clone();
        let errorData = null;

        try {
          // Try to parse error response
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await clonedResponse.json();
          } else {
            errorData = await clonedResponse.text();
          }
        } catch (e) {
          // Ignore parse errors
        }

        // Log API error
        logApiError({
          endpoint,
          method,
          status: response.status,
          error: new Error(`HTTP ${response.status}: ${response.statusText}`),
          responseData: errorData,
        });
      }

      return response;
    } catch (error) {
      const duration = performance.now() - startTime;

      // Log network error
      logApiError({
        endpoint,
        method,
        error,
        requestData: options.body ? 'Present' : undefined,
      });

      // Add breadcrumb for failed request
      addBreadcrumb({
        category: 'api',
        message: `API Error: ${method} ${endpoint}`,
        level: 'error',
        data: {
          method,
          endpoint,
          error: error.message,
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      // Re-throw to maintain original behavior
      throw error;
    }
  };
}

/**
 * Install API interceptor globally
 * Wraps window.fetch to automatically track all API calls
 */
export function installApiInterceptor() {
  if (typeof window === 'undefined' || !window.fetch) {
    return;
  }

  // Store original fetch
  const originalFetch = window.fetch;

  // Replace with tracked version
  window.fetch = createTrackedFetch(originalFetch);

  if (import.meta.env.DEV) {
    console.log(
      '%c[API Interceptor] Installed - All fetch calls will be tracked',
      'color: #4CAF50; font-weight: bold'
    );
  }

  // Return function to uninstall
  return () => {
    window.fetch = originalFetch;
    if (import.meta.env.DEV) {
      console.log('%c[API Interceptor] Uninstalled', 'color: #FF9800; font-weight: bold');
    }
  };
}

/**
 * Create axios interceptor
 * Use this if you're using axios instead of fetch
 *
 * @param {Object} axiosInstance - Axios instance
 * @returns {Object} Interceptor IDs for cleanup
 *
 * @example
 * import axios from 'axios';
 * import { createAxiosInterceptor } from '@/lib/apiInterceptor';
 *
 * const api = axios.create({ baseURL: '/api' });
 * const interceptorIds = createAxiosInterceptor(api);
 *
 * // To remove interceptors:
 * // api.interceptors.request.eject(interceptorIds.request);
 * // api.interceptors.response.eject(interceptorIds.response);
 */
export function createAxiosInterceptor(axiosInstance) {
  // Request interceptor
  const requestInterceptorId = axiosInstance.interceptors.request.use(
    (config) => {
      const method = (config.method || 'get').toUpperCase();
      const endpoint = config.url || '';

      // Store start time for duration calculation
      config.metadata = { startTime: performance.now() };

      // Add breadcrumb
      addBreadcrumb({
        category: 'api',
        message: `API Request: ${method} ${endpoint}`,
        level: 'info',
        data: {
          method,
          endpoint,
          baseURL: config.baseURL,
        },
      });

      return config;
    },
    (error) => {
      logApiError({
        endpoint: error.config?.url || 'unknown',
        method: error.config?.method?.toUpperCase() || 'UNKNOWN',
        error,
      });

      return Promise.reject(error);
    }
  );

  // Response interceptor
  const responseInterceptorId = axiosInstance.interceptors.response.use(
    (response) => {
      const method = (response.config.method || 'get').toUpperCase();
      const endpoint = response.config.url || '';
      const duration = performance.now() - (response.config.metadata?.startTime || 0);

      // Log successful request
      logDebug(`API ${method} ${endpoint} - ${response.status}`, {
        category: LogCategory.API,
        extra: {
          method,
          endpoint,
          status: response.status,
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      // Add breadcrumb
      addBreadcrumb({
        category: 'api',
        message: `API Response: ${method} ${endpoint} - ${response.status}`,
        level: 'info',
        data: {
          method,
          endpoint,
          status: response.status,
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      return response;
    },
    (error) => {
      const method = (error.config?.method || 'unknown').toUpperCase();
      const endpoint = error.config?.url || 'unknown';
      const duration = performance.now() - (error.config?.metadata?.startTime || 0);

      // Log API error
      logApiError({
        endpoint,
        method,
        status: error.response?.status,
        error,
        requestData: error.config?.data,
        responseData: error.response?.data,
      });

      // Add breadcrumb
      addBreadcrumb({
        category: 'api',
        message: `API Error: ${method} ${endpoint}`,
        level: 'error',
        data: {
          method,
          endpoint,
          status: error.response?.status,
          error: error.message,
          duration: `${duration.toFixed(2)}ms`,
        },
      });

      return Promise.reject(error);
    }
  );

  if (import.meta.env.DEV) {
    console.log(
      '%c[API Interceptor] Axios interceptors installed',
      'color: #4CAF50; font-weight: bold'
    );
  }

  return {
    request: requestInterceptorId,
    response: responseInterceptorId,
  };
}

/**
 * Track specific API call manually
 *
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Function} apiCall - API call function
 * @returns {Promise} API response
 *
 * @example
 * const data = await trackApiCall('/api/users', 'GET', async () => {
 *   return await fetch('/api/users');
 * });
 */
export async function trackApiCall(endpoint, method, apiCall) {
  return measureApiCall(endpoint, method, apiCall);
}

// Export all
export default {
  createTrackedFetch,
  installApiInterceptor,
  createAxiosInterceptor,
  trackApiCall,
};
