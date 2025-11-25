/**
 * @fileoverview Sentry Configuration for Error Tracking and Performance Monitoring
 *
 * Provides comprehensive error tracking, performance monitoring, and user feedback
 * for production and development environments.
 *
 * @module lib/sentry
 * @author FunnelAgents Development Team
 * @version 1.0.0
 */

import * as Sentry from '@sentry/react';
import { useEffect } from 'react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType
} from 'react-router-dom';

/**
 * Sentry configuration options
 */
const SENTRY_CONFIG = {
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE || 'development',
  release: `${import.meta.env.VITE_APP_NAME}@${import.meta.env.VITE_APP_VERSION}`,

  // Performance Monitoring
  tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay (optional - can be resource intensive)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Enable/Disable based on environment
  enabled: import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'false' && !!import.meta.env.VITE_SENTRY_DSN,

  // Integrations
  integrations: [
    // React Router integration for accurate route tracking
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),

    // Session Replay integration
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
      maskAllInputs: true, // Mask sensitive input fields
    }),

    // Browser Profiling
    Sentry.browserProfilingIntegration(),

    // HTTP Context
    Sentry.httpClientIntegration(),
  ],

  // Custom Configuration
  beforeSend(event, hint) {
    // Filter out certain errors in development
    if (import.meta.env.MODE === 'development') {
      // Don't send HMR errors
      if (event.message?.includes('HMR') || event.message?.includes('vite')) {
        return null;
      }
    }

    // Filter out known browser extension errors
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(frame =>
      frame.filename?.includes('chrome-extension://') ||
      frame.filename?.includes('moz-extension://') ||
      frame.filename?.includes('safari-extension://')
    )) {
      return null;
    }

    // Filter out network errors that are expected
    if (event.message?.includes('NetworkError') && event.tags?.handled === 'true') {
      return null;
    }

    return event;
  },

  // Add custom tags to all events
  initialScope: {
    tags: {
      'app.name': import.meta.env.VITE_APP_NAME || 'FunnelAgents',
      'app.version': import.meta.env.VITE_APP_VERSION || '1.0.0',
      'backend.mode': import.meta.env.VITE_BACKEND_MODE || 'nestjs',
    },
  },

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',

    // Random plugins/extensions
    'conduitPage',

    // Facebook borked
    'fb_xd_fragment',

    // ResizeObserver loop errors (common in React apps, usually harmless)
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',

    // Network errors
    'NetworkError when attempting to fetch resource',
    'Failed to fetch',
    'Load failed',

    // Safari-specific
    'Non-Error promise rejection captured',

    // HMR/Dev errors
    'import.meta.hot',
  ],

  // Deny URLs - don't track errors from these sources
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    /^safari-extension:\/\//i,

    // Facebook flakiness
    /graph\.facebook\.com/i,

    // Common CDNs (adjust based on your needs)
    /googletagmanager\.com/i,
  ],
};

/**
 * Initialize Sentry
 * Should be called as early as possible in the application lifecycle
 *
 * @returns {boolean} Whether Sentry was successfully initialized
 */
export function initSentry() {
  if (!SENTRY_CONFIG.enabled) {
    if (import.meta.env.DEV) {
      console.log(
        '%c[Sentry] Not initialized - error reporting is disabled or DSN is missing',
        'color: #FF9800; font-weight: bold'
      );
    }
    return false;
  }

  try {
    Sentry.init(SENTRY_CONFIG);

    if (import.meta.env.DEV) {
      console.log(
        '%c[Sentry] Initialized successfully',
        'color: #4CAF50; font-weight: bold',
        {
          dsn: SENTRY_CONFIG.dsn?.substring(0, 40) + '...',
          environment: SENTRY_CONFIG.environment,
          release: SENTRY_CONFIG.release,
        }
      );
    }

    return true;
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
    return false;
  }
}

/**
 * Set user context for error tracking
 * Call this after user authentication
 *
 * @param {Object} user - User information
 * @param {string} user.id - User ID
 * @param {string} [user.email] - User email
 * @param {string} [user.username] - Username
 * @param {Object} [user.metadata] - Additional user metadata
 *
 * @example
 * setUserContext({
 *   id: '12345',
 *   email: 'user@example.com',
 *   username: 'johndoe',
 *   metadata: { plan: 'premium', company: 'Acme Inc' }
 * });
 */
export function setUserContext(user) {
  if (!SENTRY_CONFIG.enabled || !user) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username || user.name,
    ...user.metadata,
  });

  if (import.meta.env.DEV) {
    console.log('[Sentry] User context set:', { id: user.id, email: user.email });
  }
}

/**
 * Clear user context
 * Call this on logout
 */
export function clearUserContext() {
  if (!SENTRY_CONFIG.enabled) return;

  Sentry.setUser(null);

  if (import.meta.env.DEV) {
    console.log('[Sentry] User context cleared');
  }
}

/**
 * Add breadcrumb for debugging
 * Breadcrumbs are trail of events leading up to an error
 *
 * @param {Object} breadcrumb - Breadcrumb data
 * @param {string} breadcrumb.message - Breadcrumb message
 * @param {string} [breadcrumb.category] - Category (e.g., 'ui', 'navigation', 'api')
 * @param {string} [breadcrumb.level] - Level (e.g., 'info', 'warning', 'error')
 * @param {Object} [breadcrumb.data] - Additional data
 *
 * @example
 * addBreadcrumb({
 *   message: 'User clicked submit button',
 *   category: 'ui',
 *   level: 'info',
 *   data: { formId: 'contact-form' }
 * });
 */
export function addBreadcrumb(breadcrumb) {
  if (!SENTRY_CONFIG.enabled) return;

  Sentry.addBreadcrumb({
    level: breadcrumb.level || 'info',
    category: breadcrumb.category || 'custom',
    message: breadcrumb.message,
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture an exception
 *
 * @param {Error} error - Error to capture
 * @param {Object} [context] - Additional context
 * @param {Object} [context.tags] - Custom tags
 * @param {Object} [context.extra] - Extra data
 * @param {string} [context.level] - Error level
 *
 * @example
 * captureException(new Error('Something went wrong'), {
 *   tags: { component: 'UserProfile' },
 *   extra: { userId: '123', action: 'update' },
 *   level: 'error'
 * });
 */
export function captureException(error, context = {}) {
  if (!SENTRY_CONFIG.enabled) {
    console.error('[Sentry disabled] Exception:', error, context);
    return;
  }

  Sentry.captureException(error, {
    level: context.level || 'error',
    tags: context.tags,
    extra: context.extra,
    contexts: context.contexts,
  });
}

/**
 * Capture a message
 *
 * @param {string} message - Message to capture
 * @param {string} [level='info'] - Message level
 * @param {Object} [context] - Additional context
 *
 * @example
 * captureMessage('User completed onboarding', 'info', {
 *   tags: { flow: 'onboarding' },
 *   extra: { step: 5 }
 * });
 */
export function captureMessage(message, level = 'info', context = {}) {
  if (!SENTRY_CONFIG.enabled) {
    console.log('[Sentry disabled] Message:', message, level, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    tags: context.tags,
    extra: context.extra,
  });
}

/**
 * Start a performance span (Sentry v8+ API)
 *
 * In Sentry v8+, the transaction-based API was replaced with a span-based API.
 * This function creates a span that can be used to track performance.
 *
 * @param {string} name - Span name
 * @param {string} [op='custom'] - Operation type
 * @returns {Object} Span wrapper object with end(), setAttribute(), and setStatus() methods
 *
 * @example
 * const span = startSpan('data-fetch', 'http.request');
 * try {
 *   await fetchData();
 *   span.setAttribute('items_fetched', 100);
 * } finally {
 *   span.end();
 * }
 */
export function startSpan(name, op = 'custom') {
  if (!SENTRY_CONFIG.enabled) {
    // Return a no-op span wrapper when Sentry is disabled
    return {
      end: () => {},
      setAttribute: () => {},
      setStatus: () => {},
    };
  }

  // Use Sentry v8+ startInactiveSpan API
  const span = Sentry.startInactiveSpan({ name, op });

  return {
    end: () => span?.end?.(),
    setAttribute: (key, value) => span?.setAttribute?.(key, value),
    setStatus: (status) => span?.setStatus?.({ code: status === 'ok' ? 1 : 2 }),
    // Direct access to the underlying span for advanced usage
    _span: span,
  };
}

/**
 * Start a performance transaction (legacy API wrapper)
 *
 * @deprecated Use startSpan() instead. This function provides backward compatibility
 * for code written against the old transaction API (Sentry v7 and earlier).
 *
 * @param {string} name - Transaction name
 * @param {string} [op='custom'] - Operation type
 * @returns {Object} Transaction-like object with finish() and setData() methods
 */
export function startTransaction(name, op = 'custom') {
  const span = startSpan(name, op);

  // Return a transaction-like interface for backward compatibility
  return {
    finish: () => span.end(),
    setData: (key, value) => span.setAttribute(key, value),
    setTag: (key, value) => span.setAttribute(key, value),
    setStatus: (status) => span.setStatus(status),
  };
}

/**
 * Measure performance of a function using Sentry v8+ span API
 *
 * @param {string} name - Measurement name
 * @param {Function} fn - Function to measure
 * @returns {Promise|any} Result of the function
 *
 * @example
 * const data = await measurePerformance('fetchUserData', async () => {
 *   return await api.getUser();
 * });
 */
export async function measurePerformance(name, fn) {
  if (!SENTRY_CONFIG.enabled) {
    return await fn();
  }

  // Use Sentry.startSpan which automatically handles the span lifecycle
  return Sentry.startSpan({ name, op: 'function' }, async (span) => {
    try {
      const result = await fn();
      span?.setStatus?.({ code: 1 }); // OK status
      return result;
    } catch (error) {
      span?.setStatus?.({ code: 2, message: error.message }); // ERROR status
      throw error;
    }
  });
}

/**
 * Track API call performance using Sentry v8+ span API
 *
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Function} apiCall - API call function
 * @returns {Promise} API response
 *
 * @example
 * const response = await trackApiCall('/api/users', 'GET', () => fetch('/api/users'));
 */
export async function trackApiCall(endpoint, method, apiCall) {
  if (!SENTRY_CONFIG.enabled) {
    return await apiCall();
  }

  const startTime = performance.now();

  return Sentry.startSpan(
    {
      name: `${method} ${endpoint}`,
      op: 'http.client',
      attributes: {
        'http.method': method,
        'http.url': endpoint,
      },
    },
    async (span) => {
      try {
        const response = await apiCall();
        const duration = performance.now() - startTime;

        span?.setAttribute?.('http.status_code', response?.status || 'unknown');
        span?.setAttribute?.('response_time', duration);
        span?.setStatus?.({ code: 1 }); // OK status

        // Add breadcrumb for API call
        addBreadcrumb({
          category: 'api',
          message: `${method} ${endpoint}`,
          level: 'info',
          data: {
            method,
            endpoint,
            status: response?.status,
            duration: `${duration.toFixed(2)}ms`,
          },
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        span?.setAttribute?.('error', error.message);
        span?.setAttribute?.('response_time', duration);
        span?.setStatus?.({ code: 2, message: error.message }); // ERROR status

        // Add breadcrumb for failed API call
        addBreadcrumb({
          category: 'api',
          message: `${method} ${endpoint} - FAILED`,
          level: 'error',
          data: {
            method,
            endpoint,
            error: error.message,
            duration: `${duration.toFixed(2)}ms`,
          },
        });

        throw error;
      }
    }
  );
}

/**
 * Show user feedback dialog
 * Allows users to report errors with additional context
 *
 * @param {Object} [options] - Feedback options
 * @param {string} [options.eventId] - Event ID to attach feedback to
 *
 * @example
 * // In an error boundary or catch block
 * const eventId = Sentry.captureException(error);
 * showFeedbackDialog({ eventId });
 */
export function showFeedbackDialog(options = {}) {
  if (!SENTRY_CONFIG.enabled) {
    console.warn('[Sentry] Feedback dialog not available - Sentry is disabled');
    return;
  }

  const eventId = options.eventId || Sentry.lastEventId();

  if (!eventId) {
    console.warn('[Sentry] No event ID available for feedback');
    return;
  }

  Sentry.showReportDialog({
    eventId,
    title: 'It looks like we\'re having issues',
    subtitle: 'Our team has been notified',
    subtitle2: 'If you\'d like to help, tell us what happened below.',
    labelName: 'Name',
    labelEmail: 'Email',
    labelComments: 'What happened?',
    labelClose: 'Close',
    labelSubmit: 'Submit',
    errorGeneric: 'An error occurred while submitting your report. Please try again.',
    errorFormEntry: 'Some fields were invalid. Please correct the errors and try again.',
    successMessage: 'Your feedback has been sent. Thank you!',
    ...options,
  });
}

/**
 * Create Sentry ErrorBoundary component
 * This is a wrapper around Sentry.ErrorBoundary with custom fallback
 *
 * @example
 * import { SentryErrorBoundary } from '@/lib/sentry';
 *
 * <SentryErrorBoundary>
 *   <App />
 * </SentryErrorBoundary>
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * HOC to wrap component with error boundary
 *
 * @param {React.Component} Component - Component to wrap
 * @param {Object} [options] - ErrorBoundary options
 * @returns {React.Component} Wrapped component
 *
 * @example
 * export default withErrorBoundary(MyComponent, {
 *   fallback: <ErrorFallback />,
 *   showDialog: true
 * });
 */
export const withErrorBoundary = Sentry.withErrorBoundary;

/**
 * Profile a React component
 *
 * @param {React.Component} Component - Component to profile
 * @returns {React.Component} Profiled component
 *
 * @example
 * export default withProfiler(MyComponent);
 */
export const withProfiler = Sentry.withProfiler;

// Export Sentry instance for advanced usage
export { Sentry };

// Export all for convenience
export default {
  init: initSentry,
  setUser: setUserContext,
  clearUser: clearUserContext,
  addBreadcrumb,
  captureException,
  captureMessage,
  startTransaction,
  measurePerformance,
  trackApiCall,
  showFeedbackDialog,
  ErrorBoundary: SentryErrorBoundary,
  withErrorBoundary,
  withProfiler,
};
