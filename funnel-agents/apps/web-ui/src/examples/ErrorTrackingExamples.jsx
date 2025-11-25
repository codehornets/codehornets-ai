/**
 * @fileoverview Error Tracking Integration Examples
 *
 * This file demonstrates how to use the error tracking and monitoring features.
 * These are examples only - do not import this file in production code.
 *
 * @module examples/ErrorTrackingExamples
 */

import React, { useState } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  logDebug,
  logInfo,
  logWarning,
  logError,
  logApiError,
  LogCategory,
} from '@/utils/errorLogger';
import { addBreadcrumb, captureException } from '@/lib/sentry';
import {
  usePagePerformance,
  useComponentPerformance,
  measureUserInteraction,
} from '@/lib/performanceMonitoring';

/**
 * Example 1: Basic Error Logging
 */
export function BasicErrorLoggingExample() {
  const handleLogError = () => {
    logError(new Error('This is a test error'), {
      category: LogCategory.UI,
      tags: { example: 'basic-error' },
      extra: { timestamp: Date.now() },
    });
  };

  const handleLogWarning = () => {
    logWarning('This is a warning message', {
      category: LogCategory.SYSTEM,
      extra: { level: 'warning-example' },
    });
  };

  const handleLogInfo = () => {
    logInfo('This is an info message', {
      category: LogCategory.UI,
      extra: { action: 'button-click' },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 1: Basic Error Logging</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button onClick={handleLogError} variant="destructive">
          Log Error
        </Button>
        <Button onClick={handleLogWarning} variant="outline">
          Log Warning
        </Button>
        <Button onClick={handleLogInfo}>Log Info</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: API Error Logging
 */
export function ApiErrorLoggingExample() {
  const [loading, setLoading] = useState(false);

  const simulateApiCall = async () => {
    setLoading(true);

    addBreadcrumb({
      message: 'Starting API call',
      category: 'api',
      data: { endpoint: '/api/test' },
    });

    try {
      // Simulate API call
      const response = await fetch('/api/nonexistent-endpoint');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logInfo('API call successful', {
        category: LogCategory.API,
        extra: { endpoint: '/api/test' },
      });
    } catch (error) {
      logApiError({
        endpoint: '/api/test',
        method: 'GET',
        status: error.status,
        error,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 2: API Error Logging</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={simulateApiCall} disabled={loading}>
          {loading ? 'Loading...' : 'Simulate Failed API Call'}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 3: Error Boundary
 */
function ComponentThatThrows() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('Component error triggered!');
  }

  return (
    <div>
      <p>This component is working normally.</p>
      <Button onClick={() => setShouldThrow(true)} variant="destructive">
        Trigger Component Error
      </Button>
    </div>
  );
}

export function ErrorBoundaryExample() {
  const [key, setKey] = useState(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 3: Error Boundary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={() => setKey(key + 1)} variant="outline">
          Reset Component
        </Button>
        <ErrorBoundary name="ExampleErrorBoundary" key={key}>
          <ComponentThatThrows />
        </ErrorBoundary>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Performance Monitoring
 */
export function PerformanceMonitoringExample() {
  usePagePerformance('ErrorTrackingExamples');
  useComponentPerformance('PerformanceExample');

  const simulateSlowOperation = async () => {
    await measureUserInteraction('slow-operation', async () => {
      // Simulate slow operation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      logInfo('Slow operation completed', {
        category: LogCategory.PERFORMANCE,
        extra: { duration: '2000ms' },
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 4: Performance Monitoring</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={simulateSlowOperation}>
          Simulate Slow Operation (2s)
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Check console for performance metrics
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: Breadcrumbs
 */
export function BreadcrumbsExample() {
  const [step, setStep] = useState(0);

  const handleStep = (stepNumber) => {
    addBreadcrumb({
      message: `User completed step ${stepNumber}`,
      category: 'ui',
      level: 'info',
      data: { step: stepNumber },
    });

    setStep(stepNumber);
  };

  const triggerErrorWithBreadcrumbs = () => {
    addBreadcrumb({
      message: 'User triggered error with context',
      category: 'ui',
      level: 'warning',
      data: { currentStep: step },
    });

    captureException(new Error('Error with breadcrumb trail'), {
      tags: { example: 'breadcrumbs' },
      extra: { currentStep: step },
    });

    logError('Error occurred after step ' + step, {
      category: LogCategory.UI,
      extra: { step },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 5: Breadcrumbs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-x-2">
          <Button onClick={() => handleStep(1)} variant="outline">
            Step 1
          </Button>
          <Button onClick={() => handleStep(2)} variant="outline">
            Step 2
          </Button>
          <Button onClick={() => handleStep(3)} variant="outline">
            Step 3
          </Button>
        </div>
        <p className="text-sm">Current Step: {step}</p>
        <Button onClick={triggerErrorWithBreadcrumbs} variant="destructive">
          Trigger Error (Check Sentry for breadcrumb trail)
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 6: Try-Catch with Logging
 */
export function TryCatchExample() {
  const performRiskyOperation = async () => {
    try {
      addBreadcrumb({
        message: 'Starting risky operation',
        category: 'system',
        level: 'info',
      });

      // Simulate operation that might fail
      const random = Math.random();
      if (random < 0.5) {
        throw new Error('Random operation failed');
      }

      logInfo('Risky operation succeeded', {
        category: LogCategory.SYSTEM,
        extra: { probability: random },
      });

      alert('Operation succeeded!');
    } catch (error) {
      logError(error, {
        category: LogCategory.SYSTEM,
        tags: { operation: 'risky' },
        extra: { attempt: Date.now() },
      });

      alert('Operation failed - check console and Sentry');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Example 6: Try-Catch with Logging</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={performRiskyOperation}>
          Perform Risky Operation (50% fail rate)
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Main Examples Component
 */
export default function ErrorTrackingExamples() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Tracking Examples</h1>
        <p className="text-muted-foreground">
          Demonstrations of error tracking and monitoring features. Open the
          browser console and Sentry dashboard to see results.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <BasicErrorLoggingExample />
        <ApiErrorLoggingExample />
        <ErrorBoundaryExample />
        <PerformanceMonitoringExample />
        <BreadcrumbsExample />
        <TryCatchExample />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to View Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <strong>Browser Console:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>See formatted log messages</li>
              <li>View performance metrics</li>
              <li>Check breadcrumb trail</li>
            </ul>
          </div>
          <div>
            <strong>Sentry Dashboard:</strong>
            <ul className="list-disc list-inside ml-4">
              <li>View captured errors</li>
              <li>See user context</li>
              <li>Review breadcrumb trail</li>
              <li>Check performance transactions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
