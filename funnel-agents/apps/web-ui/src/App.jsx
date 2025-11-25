import './App.css'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import VisualEditAgent from '@/lib/VisualEditAgent'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import ProtectedRoute, { PublicRoute, OnboardingRoute } from '@/components/auth/ProtectedRoute';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { setUserContext, clearUserContext, addBreadcrumb } from '@/lib/sentry';
import { useEffect } from 'react';
import nestjsClient from '@/api/nestjsClient';
import { migrateAuthTokens } from '@/utils/migrateAuthTokens';

// Migrate old authentication tokens on app load
migrateAuthTokens();

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { authError, user } = useAuth();

  // Set user context for Sentry when user is authenticated
  useEffect(() => {
    if (user) {
      setUserContext({
        id: user.id || user._id,
        email: user.email,
        username: user.username || user.name,
        metadata: {
          role: user.role,
          // Add any other relevant user metadata
        },
      });

      // Add breadcrumb for login
      addBreadcrumb({
        category: 'auth',
        message: 'User authenticated',
        level: 'info',
        data: {
          userId: user.id || user._id,
          email: user.email,
        },
      });
    } else {
      clearUserContext();
    }
  }, [user]);

  // Handle specific authentication errors
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  // Public routes (Login and Signup should not require authentication)
  const publicRoutes = ['Login', 'Signup', 'Landing', 'ForgotPassword', 'ResetPassword', 'Documentation', 'Support', 'ApiDocs', 'Terms', 'Privacy'];

  // Render the main app
  return (
    <Routes>
      {/* Onboarding route - special handling for post-signup users */}
      {Pages.Onboarding && (
        <Route
          path="/Onboarding"
          element={
            <OnboardingRoute>
              <Pages.Onboarding />
            </OnboardingRoute>
          }
        />
      )}

      {/* Public routes */}
      {publicRoutes.map((routeName) => {
        const Page = Pages[routeName];
        if (!Page) return null;

        return (
          <Route
            key={routeName}
            path={`/${routeName}`}
            element={
              <PublicRoute>
                <Page />
              </PublicRoute>
            }
          />
        );
      })}

      {/* Main page - can be public or protected based on mainPage setting */}
      <Route
        path="/"
        element={
          publicRoutes.includes(mainPageKey) ? (
            <PublicRoute>
              <MainPage />
            </PublicRoute>
          ) : (
            <ProtectedRoute>
              <LayoutWrapper currentPageName={mainPageKey}>
                <MainPage />
              </LayoutWrapper>
            </ProtectedRoute>
          )
        }
      />

      {/* Protected routes with dynamic parameters */}
      <Route
        path="/content/:id"
        element={
          <ProtectedRoute>
            <LayoutWrapper currentPageName="ContentDetail">
              {Pages.ContentDetail && <Pages.ContentDetail />}
            </LayoutWrapper>
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      {Object.entries(Pages)
        .filter(([path]) => !publicRoutes.includes(path) && path !== 'Onboarding')
        .map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <ProtectedRoute>
                <LayoutWrapper currentPageName={path}>
                  <Page />
                </LayoutWrapper>
              </ProtectedRoute>
            }
          />
        ))}

      {/* 404 Page */}
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  // Initialize CSRF protection on app startup
  useEffect(() => {
    const initSecurity = async () => {
      try {
        await nestjsClient.initializeCsrf();
        console.log('Security initialized: CSRF protection enabled');
      } catch (error) {
        console.error('Failed to initialize security:', error);
        // Continue app execution - CSRF will be fetched on first request
      }
    };

    initSecurity();
  }, []);

  return (
    <ErrorBoundary name="AppRoot">
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <NavigationTracker />
            <AuthenticatedApp />
          </BrowserRouter>
          <Toaster />
          <VisualEditAgent />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
