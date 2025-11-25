/**
 * @fileoverview Performance Monitoring Utilities
 *
 * Provides performance monitoring for page loads, API calls, and key user flows.
 * Integrates with Sentry for tracking performance metrics.
 *
 * @module lib/performanceMonitoring
 * @author FunnelAgents Development Team
 * @version 1.0.0
 */

import { startTransaction, measurePerformance, trackApiCall, addBreadcrumb } from '@/lib/sentry';
import { logPerformanceIssue, logDebug, LogCategory } from '@/utils/errorLogger';
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  PAGE_LOAD: 3000,      // Page load should be under 3s
  API_CALL: 2000,       // API calls should be under 2s
  COMPONENT_RENDER: 100, // Component render should be under 100ms
  USER_INTERACTION: 500, // User interactions should respond under 500ms
};

/**
 * Track page load performance
 * Call this once when the app initializes
 */
export function trackPageLoadPerformance() {
  if (!window.performance || !window.performance.timing) {
    return;
  }

  // Wait for page to fully load
  if (document.readyState === 'complete') {
    measurePageLoad();
  } else {
    window.addEventListener('load', measurePageLoad);
  }
}

/**
 * Measure page load metrics
 */
function measurePageLoad() {
  try {
    const timing = window.performance.timing;
    const navigation = window.performance.navigation;

    // Calculate metrics
    const metrics = {
      // Total page load time
      pageLoad: timing.loadEventEnd - timing.navigationStart,

      // Time to first byte
      ttfb: timing.responseStart - timing.navigationStart,

      // DNS lookup time
      dns: timing.domainLookupEnd - timing.domainLookupStart,

      // TCP connection time
      tcp: timing.connectEnd - timing.connectStart,

      // Request time
      request: timing.responseEnd - timing.requestStart,

      // DOM processing time
      domProcessing: timing.domComplete - timing.domLoading,

      // DOM content loaded
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,

      // Navigation type
      navigationType: ['navigate', 'reload', 'back_forward', 'prerender'][navigation.type] || 'unknown',
    };

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group('%c[Performance] Page Load Metrics', 'color: #2196F3; font-weight: bold');
      console.table(metrics);
      console.groupEnd();
    }

    // Track with Sentry
    const transaction = startTransaction('page-load', 'pageload');
    transaction.setData('metrics', metrics);

    // Check for performance issues
    if (metrics.pageLoad > PERFORMANCE_THRESHOLDS.PAGE_LOAD) {
      logPerformanceIssue(
        'page-load',
        metrics.pageLoad,
        PERFORMANCE_THRESHOLDS.PAGE_LOAD,
        { extra: metrics }
      );
    }

    transaction.finish();

    // Add breadcrumb
    addBreadcrumb({
      category: 'performance',
      message: 'Page loaded',
      level: 'info',
      data: {
        pageLoad: `${metrics.pageLoad}ms`,
        ttfb: `${metrics.ttfb}ms`,
      },
    });
  } catch (error) {
    console.error('[Performance] Failed to measure page load:', error);
  }
}

/**
 * React Hook to track page navigation performance
 *
 * @example
 * function MyPage() {
 *   usePagePerformance('MyPage');
 *   return <div>...</div>;
 * }
 */
export function usePagePerformance(pageName) {
  const location = useLocation();
  const transactionRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    // Start transaction when component mounts
    startTimeRef.current = performance.now();
    transactionRef.current = startTransaction(`page-view-${pageName}`, 'navigation');

    addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${pageName}`,
      level: 'info',
      data: {
        path: location.pathname,
      },
    });

    return () => {
      // Finish transaction when component unmounts
      if (transactionRef.current) {
        const duration = performance.now() - startTimeRef.current;

        transactionRef.current.setData('duration', duration);
        transactionRef.current.setData('path', location.pathname);

        // Check for slow page loads
        if (duration > PERFORMANCE_THRESHOLDS.PAGE_LOAD) {
          logPerformanceIssue(
            `page-view-${pageName}`,
            duration,
            PERFORMANCE_THRESHOLDS.PAGE_LOAD,
            {
              extra: {
                path: location.pathname,
              },
            }
          );
        }

        transactionRef.current.finish();

        logDebug(`Page ${pageName} rendered in ${duration.toFixed(2)}ms`, {
          category: LogCategory.PERFORMANCE,
          extra: { duration, path: location.pathname },
        });
      }
    };
  }, [pageName, location.pathname]);
}

/**
 * React Hook to track component render performance
 *
 * @param {string} componentName - Component name
 *
 * @example
 * function MyComponent() {
 *   useComponentPerformance('MyComponent');
 *   return <div>...</div>;
 * }
 */
export function useComponentPerformance(componentName) {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    const duration = performance.now() - startTimeRef.current;
    renderCountRef.current += 1;

    if (renderCountRef.current === 1) {
      // First render
      logDebug(`${componentName} initial render: ${duration.toFixed(2)}ms`, {
        category: LogCategory.PERFORMANCE,
        extra: { duration },
      });

      if (duration > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER) {
        logPerformanceIssue(
          `component-render-${componentName}`,
          duration,
          PERFORMANCE_THRESHOLDS.COMPONENT_RENDER,
          {
            extra: {
              component: componentName,
              renderType: 'initial',
            },
          }
        );
      }
    }

    startTimeRef.current = performance.now();
  });
}

/**
 * Measure API call performance
 * Wrapper for API calls that tracks performance
 *
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {Function} apiCall - API call function
 * @returns {Promise} API response
 *
 * @example
 * const response = await measureApiCall('/api/users', 'GET', () => {
 *   return fetch('/api/users');
 * });
 */
export async function measureApiCall(endpoint, method, apiCall) {
  const startTime = performance.now();

  try {
    const response = await trackApiCall(endpoint, method, apiCall);
    const duration = performance.now() - startTime;

    // Check for slow API calls
    if (duration > PERFORMANCE_THRESHOLDS.API_CALL) {
      logPerformanceIssue(
        `api-${method}-${endpoint}`,
        duration,
        PERFORMANCE_THRESHOLDS.API_CALL,
        {
          extra: {
            endpoint,
            method,
            status: response?.status,
          },
        }
      );
    }

    return response;
  } catch (error) {
    const duration = performance.now() - startTime;

    logDebug(`API call failed: ${method} ${endpoint} (${duration.toFixed(2)}ms)`, {
      category: LogCategory.API,
      extra: {
        endpoint,
        method,
        duration,
        error: error.message,
      },
    });

    throw error;
  }
}

/**
 * Measure user interaction performance
 *
 * @param {string} action - Action name
 * @param {Function} callback - Callback function
 * @returns {Promise} Result of callback
 *
 * @example
 * const handleClick = () => {
 *   measureUserInteraction('button-click', async () => {
 *     await saveData();
 *   });
 * };
 */
export async function measureUserInteraction(action, callback) {
  const startTime = performance.now();

  try {
    const result = await callback();
    const duration = performance.now() - startTime;

    addBreadcrumb({
      category: 'ui',
      message: `User interaction: ${action}`,
      level: 'info',
      data: {
        action,
        duration: `${duration.toFixed(2)}ms`,
      },
    });

    if (duration > PERFORMANCE_THRESHOLDS.USER_INTERACTION) {
      logPerformanceIssue(
        `user-interaction-${action}`,
        duration,
        PERFORMANCE_THRESHOLDS.USER_INTERACTION,
        {
          extra: {
            action,
          },
        }
      );
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logDebug(`User interaction failed: ${action} (${duration.toFixed(2)}ms)`, {
      category: LogCategory.UI,
      extra: {
        action,
        duration,
        error: error.message,
      },
    });

    throw error;
  }
}

/**
 * Track custom transaction
 *
 * @param {string} name - Transaction name
 * @param {Function} callback - Callback function
 * @returns {Promise} Result of callback
 *
 * @example
 * const data = await trackTransaction('complex-operation', async () => {
 *   // Complex operation
 *   return result;
 * });
 */
export async function trackTransaction(name, callback) {
  return measurePerformance(name, callback);
}

/**
 * Get Web Vitals metrics
 * Measures Core Web Vitals: LCP, FID, CLS
 */
export function trackWebVitals() {
  if (!window.PerformanceObserver) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      const lcp = lastEntry.renderTime || lastEntry.loadTime;

      addBreadcrumb({
        category: 'performance',
        message: 'LCP measured',
        level: 'info',
        data: {
          lcp: `${lcp.toFixed(2)}ms`,
        },
      });

      if (import.meta.env.DEV) {
        console.log('%c[Performance] LCP:', 'color: #2196F3', `${lcp.toFixed(2)}ms`);
      }
    });

    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.error('[Performance] Failed to observe LCP:', error);
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fid = entry.processingStart - entry.startTime;

        addBreadcrumb({
          category: 'performance',
          message: 'FID measured',
          level: 'info',
          data: {
            fid: `${fid.toFixed(2)}ms`,
          },
        });

        if (import.meta.env.DEV) {
          console.log('%c[Performance] FID:', 'color: #2196F3', `${fid.toFixed(2)}ms`);
        }
      });
    });

    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.error('[Performance] Failed to observe FID:', error);
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      if (import.meta.env.DEV) {
        console.log('%c[Performance] CLS:', 'color: #2196F3', clsValue.toFixed(4));
      }
    });

    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Report CLS on page unload
    window.addEventListener('beforeunload', () => {
      addBreadcrumb({
        category: 'performance',
        message: 'CLS measured',
        level: 'info',
        data: {
          cls: clsValue.toFixed(4),
        },
      });
    });
  } catch (error) {
    console.error('[Performance] Failed to observe CLS:', error);
  }
}

/**
 * Initialize performance monitoring
 * Call this once when the app starts
 */
export function initPerformanceMonitoring() {
  trackPageLoadPerformance();
  trackWebVitals();

  if (import.meta.env.DEV) {
    console.log(
      '%c[Performance Monitoring] Initialized',
      'color: #4CAF50; font-weight: bold'
    );
  }
}

// Export all for convenience
export default {
  initPerformanceMonitoring,
  trackPageLoadPerformance,
  trackWebVitals,
  usePagePerformance,
  useComponentPerformance,
  measureApiCall,
  measureUserInteraction,
  trackTransaction,
  PERFORMANCE_THRESHOLDS,
};
