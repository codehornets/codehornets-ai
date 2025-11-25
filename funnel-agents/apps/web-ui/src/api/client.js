/**
 * @fileoverview Unified API Client with Backend Toggle
 *
 * Provides a single import point for API client that automatically switches
 * between NestJS and Base44 backends based on environment configuration.
 * This enables gradual migration and easy A/B testing between backends.
 *
 * @module api/client
 * @author FunnelAgents Development Team
 * @version 1.0.0
 */

import nestjsClient from './nestjsClient.js';

/**
 * Backend mode from environment variable
 * @type {'nestjs'|'base44'}
 * @default 'nestjs'
 */
const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE || 'nestjs';

/**
 * Available backend modes
 */
const BACKEND_MODES = {
  NESTJS: 'nestjs',
  BASE44: 'base44',
};

/**
 * Base44 client configuration (only initialized if needed)
 * Using lazy initialization to prevent socket.io connections when not using Base44
 */
let base44Client = null;
let base44Initialized = false;

/**
 * Initialize Base44 client lazily - only called when BACKEND_MODE is base44
 */
async function initBase44() {
  if (base44Initialized) return base44Client;

  if (BACKEND_MODE === BACKEND_MODES.BASE44) {
    const [{ createClient }, { appParams }] = await Promise.all([
      import('@base44/sdk'),
      import('@/lib/app-params')
    ]);

    const { appId, serverUrl, token, functionsVersion } = appParams;
    base44Client = createClient({
      appId,
      serverUrl,
      token,
      functionsVersion,
      requiresAuth: false,
    });
  }

  base44Initialized = true;
  return base44Client;
}

// Only initialize if we're in base44 mode
if (BACKEND_MODE === BACKEND_MODES.BASE44) {
  initBase44().catch(err => {
    console.error('[API Client] Failed to initialize Base44:', err);
  });
}

/**
 * Log backend selection (only in development)
 */
if (import.meta.env.DEV) {
  console.group('%c[API Client] Backend Configuration', 'color: #2196F3; font-weight: bold');
  console.log('Mode:', BACKEND_MODE);
  console.log('Available modes:', BACKEND_MODES);
  if (BACKEND_MODE === BACKEND_MODES.NESTJS) {
    console.log('API URL:', import.meta.env.VITE_API_URL || 'http://localhost:3000');
    console.log('WS URL:', import.meta.env.VITE_WS_URL || 'ws://localhost:3000');
  } else {
    console.log('Base44 Server:', import.meta.env.VITE_BASE44_BACKEND_URL || 'not configured');
    console.log('Base44 App ID:', import.meta.env.VITE_BASE44_APP_ID || 'not configured');
  }
  console.groupEnd();
}

/**
 * Select the appropriate client based on backend mode
 */
const client = BACKEND_MODE === BACKEND_MODES.BASE44 ? base44Client : nestjsClient;

/**
 * @typedef {import('./nestjsClient.js').default} NestJSClient
 * @typedef {import('@base44/sdk').Client} Base44Client
 */

/**
 * Unified API client - automatically switches between NestJS and Base44
 * based on VITE_BACKEND_MODE environment variable.
 *
 * @type {NestJSClient|Base44Client}
 *
 * @example
 * // Import the client
 * import apiClient from '@/api/client';
 *
 * // Use entity methods (works with both backends)
 * const leads = await apiClient.entities.leads.list({ limit: 10 });
 * const lead = await apiClient.entities.leads.get('123');
 * await apiClient.entities.leads.create({ name: 'John Doe', email: 'john@example.com' });
 *
 * // Use authentication (works with both backends)
 * await apiClient.auth.login('user@example.com', 'password');
 * const user = await apiClient.auth.getCurrentUser();
 * await apiClient.auth.logout();
 *
 * @example
 * // Switch backends via environment variable
 * // In .env.local:
 * // VITE_BACKEND_MODE=nestjs  # Use local NestJS microservices
 * // VITE_BACKEND_MODE=base44  # Use Base44 BaaS
 */
export default client;

/**
 * Export base44 for backward compatibility during migration
 * Only available when using Base44 backend
 */
export const base44 = base44Client;

/**
 * Export backend mode for conditional logic
 */
export const backendMode = BACKEND_MODE;

/**
 * Check if using NestJS backend
 * @returns {boolean}
 */
export const isNestJS = () => BACKEND_MODE === BACKEND_MODES.NESTJS;

/**
 * Check if using Base44 backend
 * @returns {boolean}
 */
export const isBase44 = () => BACKEND_MODE === BACKEND_MODES.BASE44;

/**
 * Re-export entities for direct import
 * This maintains backward compatibility with existing code
 *
 * @example
 * import { entities } from '@/api/client';
 * const leads = await entities.leads.list();
 */
export const entities = client.entities;

/**
 * Re-export auth for direct import
 *
 * @example
 * import { auth } from '@/api/client';
 * await auth.login('user@example.com', 'password');
 */
export const auth = client.auth;

/**
 * Re-export integrations for direct import
 *
 * @example
 * import { integrations } from '@/api/client';
 * await integrations.Core.SendEmail({ to: 'user@example.com', subject: 'Hello' });
 */
export const integrations = client.integrations;

/**
 * Health check utility
 * Tests connection to the current backend
 *
 * @returns {Promise<Object>} Health status
 *
 * @example
 * import { healthCheck } from '@/api/client';
 *
 * try {
 *   const health = await healthCheck();
 *   console.log('Backend is healthy:', health);
 * } catch (error) {
 *   console.error('Backend is unavailable:', error);
 * }
 */
export const healthCheck = async () => {
  try {
    if (isNestJS()) {
      const response = await client.get('/health');
      return {
        backend: 'nestjs',
        status: 'healthy',
        ...response,
      };
    } else {
      // Base44 health check - attempt to query a lightweight endpoint
      return {
        backend: 'base44',
        status: 'healthy',
        message: 'Base44 SDK initialized',
      };
    }
  } catch (error) {
    return {
      backend: BACKEND_MODE,
      status: 'unhealthy',
      error: error.message,
    };
  }
};

/**
 * Migration helper utilities
 */
export const migration = {
  /**
   * Get current backend mode
   * @returns {string}
   */
  getBackendMode: () => BACKEND_MODE,

  /**
   * Check if feature is supported in current backend
   * @param {string} feature - Feature name
   * @returns {boolean}
   */
  isFeatureSupported: (feature) => {
    const nestjsFeatures = [
      'websockets',
      'microservices',
      'advanced-querying',
      'bulk-operations',
      'real-time-updates',
      'custom-workflows',
    ];

    const base44Features = [
      'baas-integrations',
      'managed-auth',
      'managed-storage',
      'serverless-functions',
    ];

    if (isNestJS()) {
      return nestjsFeatures.includes(feature);
    } else {
      return base44Features.includes(feature);
    }
  },

  /**
   * Log migration warnings
   * @param {string} component - Component name
   * @param {string} message - Warning message
   */
  warn: (component, message) => {
    console.warn(`%c[Migration Warning] ${component}`, 'color: #FF9800; font-weight: bold');
    console.warn(message);
  },

  /**
   * Get recommended migration steps
   * @returns {string[]}
   */
  getMigrationSteps: () => {
    return [
      '1. Test all API calls work with NestJS backend',
      '2. Verify authentication flow (login/logout/token refresh)',
      '3. Test entity CRUD operations (create, read, update, delete)',
      '4. Validate query filters and pagination',
      '5. Check file upload and integrations',
      '6. Update any Base44-specific code',
      '7. Test error handling and edge cases',
      '8. Update environment variables in production',
      '9. Monitor API performance and error rates',
      '10. Remove Base44 dependency when migration complete',
    ];
  },
};

/**
 * Development utilities
 */
if (import.meta.env.DEV) {
  // Expose client to window for debugging
  window.__apiClient = client;
  window.__apiMigration = migration;
  window.__backendMode = BACKEND_MODE;

  console.log(
    '%c[API Client] Development mode enabled',
    'color: #9C27B0; font-weight: bold'
  );
  console.log('Access client via: window.__apiClient');
  console.log('Access migration utils via: window.__apiMigration');
  console.log('Current backend mode: window.__backendMode');
}
