import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute Component
 *
 * A route guard that protects pages requiring authentication.
 * Redirects unauthenticated users to the login page while preserving
 * their intended destination for redirect after successful login.
 * Also redirects users who haven't completed onboarding to the onboarding page.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The protected content to render
 * @param {string} props.redirectTo - Override default redirect path (default: '/Login')
 * @param {boolean} props.requireAdmin - If true, also checks for admin role
 * @param {boolean} props.requireOnboarding - If true, redirects to onboarding if not completed (default: true)
 */
const ProtectedRoute = ({
  children,
  redirectTo = '/Login',
  requireAdmin = false,
  requireOnboarding = true
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to access
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user needs to complete onboarding (skip for onboarding page itself)
  if (requireOnboarding && user && user.onboarding_completed === false && location.pathname !== '/Onboarding') {
    return <Navigate to="/Onboarding" replace />;
  }

  // Check admin requirement if specified
  if (requireAdmin && user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You do not have permission to access this page. Admin privileges are required.
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated (and has required role if specified), render children
  return children;
};

/**
 * PublicRoute Component
 *
 * A route guard for public pages like Login and Signup.
 * Redirects authenticated users away from these pages.
 * Takes into account onboarding status - redirects to onboarding if not completed.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The public content to render
 * @param {string} props.redirectTo - Where to redirect authenticated users (default: '/Dashboard')
 */
export const PublicRoute = ({
  children,
  redirectTo = '/Dashboard'
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users
  if (isAuthenticated) {
    // If user hasn't completed onboarding, redirect to onboarding instead
    if (user && user.onboarding_completed === false) {
      return <Navigate to="/Onboarding" replace />;
    }
    // Otherwise redirect to dashboard
    return <Navigate to={redirectTo} replace />;
  }

  // User is not authenticated, render children
  return children;
};

/**
 * OnboardingRoute Component
 *
 * A route guard specifically for the onboarding page.
 * Only allows authenticated users who haven't completed onboarding.
 * Redirects to Dashboard if onboarding is already complete.
 * Redirects to Login if not authenticated.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The onboarding content to render
 */
export const OnboardingRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  // If onboarding is already completed, redirect to dashboard
  if (user && user.onboarding_completed === true) {
    return <Navigate to="/Dashboard" replace />;
  }

  // User is authenticated and hasn't completed onboarding, render children
  return children;
};

/**
 * ConditionalRoute Component
 *
 * A flexible route guard that can check custom conditions.
 * Useful for complex authorization scenarios.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render
 * @param {Function} props.condition - Function that returns true if access should be granted
 * @param {string} props.redirectTo - Where to redirect if condition fails
 * @param {React.ReactNode} props.fallback - Optional fallback content instead of redirect
 */
export const ConditionalRoute = ({
  children,
  condition,
  redirectTo = '/Dashboard',
  fallback = null
}) => {
  const { isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check the condition
  const hasAccess = condition();

  if (!hasAccess) {
    // Show fallback content if provided
    if (fallback) {
      return fallback;
    }

    // Otherwise redirect
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Condition passed, render children
  return children;
};

export default ProtectedRoute;
