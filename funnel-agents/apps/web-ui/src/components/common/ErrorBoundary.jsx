import React from 'react';
import { AlertCircle, RefreshCw, Home, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { captureException, addBreadcrumb, showFeedbackDialog, Sentry } from '@/lib/sentry';
import { logError } from '@/utils/errorLogger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reported: false,
      sentryEventId: null,
    };
  }

  static getDerivedStateFromError(_error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to Sentry and error logging service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    try {
      // Add breadcrumb for component stack
      addBreadcrumb({
        category: 'error-boundary',
        message: 'Component error occurred',
        level: 'error',
        data: {
          componentStack: errorInfo.componentStack?.substring(0, 200),
        },
      });

      // Capture exception with context
      const eventId = captureException(error, {
        tags: {
          error_boundary: 'true',
          component: this.props.name || 'ErrorBoundary',
        },
        extra: {
          componentStack: errorInfo.componentStack,
          errorInfo,
          url: window.location.href,
        },
        level: 'error',
      });

      // Store event ID for user feedback
      this.setState({ sentryEventId: eventId });

      // Log using error logger
      logError(error, {
        category: 'ui',
        tags: {
          error_boundary: 'true',
        },
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });

      console.log('Error logged to Sentry with ID:', eventId);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isReporting: false,
      reported: false,
      sentryEventId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleShowFeedback = () => {
    try {
      // Show Sentry feedback dialog
      showFeedbackDialog({
        eventId: this.state.sentryEventId || Sentry.lastEventId(),
      });
      this.setState({ reported: true });
    } catch (error) {
      console.error('Failed to show feedback dialog:', error);
      this.fallbackReportIssue();
    }
  };

  fallbackReportIssue = async () => {
    this.setState({ isReporting: true });

    try {
      // Create a support ticket or error report
      const errorReport = {
        type: 'error_report',
        title: `Error: ${this.state.error?.message || 'Unknown error'}`,
        description: `
**Error Message:**
${this.state.error?.toString() || 'No error message'}

**Stack Trace:**
\`\`\`
${this.state.error?.stack || 'No stack trace'}
\`\`\`

**Component Stack:**
\`\`\`
${this.state.errorInfo?.componentStack || 'No component stack'}
\`\`\`

**URL:** ${window.location.href}
**User Agent:** ${navigator.userAgent}
**Timestamp:** ${new Date().toISOString()}
**Sentry Event ID:** ${this.state.sentryEventId || 'N/A'}
        `,
        severity: 'high',
        metadata: {
          error: this.state.error?.message,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          sentryEventId: this.state.sentryEventId,
        },
      };

      // TODO: Replace with your actual error reporting endpoint
      // await client.entities.ErrorReport.create(errorReport);

      console.log('Error report:', errorReport);

      this.setState({ isReporting: false, reported: true });
    } catch (error) {
      console.error('Failed to report error:', error);
      this.setState({ isReporting: false });
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Something went wrong</CardTitle>
                  <CardDescription>
                    An unexpected error occurred in the application
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error message */}
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                </AlertDescription>
              </Alert>

              {/* Error details (only in development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="space-y-2">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                    Show technical details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
                      <p className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </p>
                    </div>
                    {this.state.errorInfo && (
                      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-x-auto">
                        <p className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </p>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Success message after reporting */}
              {this.state.reported && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    Thank you! The error has been reported to our team.
                  </AlertDescription>
                </Alert>
              )}

              {/* Helpful information */}
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <p>You can try the following actions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Try again - The error might be temporary</li>
                  <li>Reload the page - This will refresh the application</li>
                  <li>Go home - Return to the dashboard</li>
                  <li>Report issue - Let us know what happened</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>

              <Button
                onClick={this.handleReload}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>

              <Button
                onClick={this.handleGoHome}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>

              <Button
                onClick={this.handleShowFeedback}
                variant="secondary"
                disabled={this.state.isReporting || this.state.reported}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {this.state.isReporting
                  ? 'Reporting...'
                  : this.state.reported
                  ? 'Reported'
                  : 'Send Feedback'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    // Render children if no error
    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional wrapper for using with hooks if needed
export function ErrorBoundaryWrapper({ children, fallback }) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}
