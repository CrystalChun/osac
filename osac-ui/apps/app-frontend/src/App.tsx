import { useCallback, useRef } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import type { DemoShellRole } from '@osac/api-contracts';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { AuthCallback, SignInPage } from './pages/auth';
import { AppShell } from './pages/shell';

const InnerApp = () => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const onNavigateAfterLogin = useCallback((role: DemoShellRole) => {
    if (role === 'providerAdmin') {
      navigateRef.current('/provider/dashboard');
    } else if (role === 'tenantAdmin') {
      navigateRef.current('/admin/dashboard');
    } else {
      navigateRef.current('/dashboard');
    }
  }, []);

  const onNavigateToWelcome = useCallback(() => {
    navigateRef.current('/');
  }, []);

  return (
    <SessionProvider
      onNavigateAfterLogin={onNavigateAfterLogin}
      onNavigateToWelcome={onNavigateToWelcome}
    >
      <AppRoutes />
    </SessionProvider>
  );
};

const AppRoutes = () => {
  const { isLoggedIn, isAuthLoading } = useSession();

  // Show a full-page spinner while we check for an existing session on mount.
  if (isAuthLoading) {
    return (
      <Bullseye style={{ height: '100vh' }}>
        <Spinner aria-label="Loading…" />
      </Bullseye>
    );
  }

  return (
    <Routes>
      {/* OIDC callback — must be accessible before auth is resolved. */}
      <Route path="/callback" element={<AuthCallback />} />
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <SignInPage />}
      />

      <Route path="/*" element={isLoggedIn ? <AppShell /> : <Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <InnerApp />
    </BrowserRouter>
  );
}
