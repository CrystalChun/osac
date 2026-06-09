/**
 * flow: institutional-sign-in
 * step: auth_sign_in_redirect
 *
 * Automatically initiates the OIDC Authorization Code + PKCE flow via the Go proxy BFF as soon
 * as this page is rendered. The user never needs to click anything — landing here means "start
 * login". On error a retry button is shown.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bullseye, Button, Spinner, Title } from '@patternfly/react-core';
import { useSession } from '../../contexts/SessionContext';

const startOIDCLogin = async (): Promise<void> => {
  const redirectBase = encodeURIComponent(window.location.origin);
  const resp = await fetch(`/api/login?redirect_base=${redirectBase}`, {
    credentials: 'include',
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(text || `Failed to start login (HTTP ${resp.status})`);
  }
  const { url } = (await resp.json()) as { url?: string };
  if (!url) {
    throw new Error('No authorization URL returned by proxy');
  }
  window.location.href = url;
};

export const SignInPage = () => {
  const { logout } = useSession();
  const navigate = useNavigate();
  const calledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const triggerLogin = () => {
    setError(null);
    calledRef.current = false; // allow retry
    startOIDCLogin().catch((err: Error) => {
      setError(err.message);
    });
  };

  useEffect(() => {
    if (calledRef.current) {
      return;
    }
    calledRef.current = true;
    triggerLogin();
  }, []);

  const handleChooseAnother = () => {
    logout().catch(() => undefined);
    navigate('/');
  };

  if (error) {
    return (
      <Bullseye style={{ height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Title headingLevel="h1" size="xl" style={{ marginBottom: '1rem' }}>
            Sign-in failed
          </Title>
          <p style={{ marginBottom: '1.5rem', color: 'var(--pf-t--global--text--color--subtle)' }}>
            {error}
          </p>
          <Button variant="primary" onClick={triggerLogin} style={{ marginRight: '0.5rem' }}>
            Retry
          </Button>
          <Button variant="link" onClick={handleChooseAnother}>
            Choose another account
          </Button>
        </div>
      </Bullseye>
    );
  }

  return (
    <Bullseye style={{ height: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner aria-label="Redirecting to sign in…" style={{ marginBottom: '1rem' }} />
        <p style={{ color: 'var(--pf-t--global--text--color--subtle)' }}>Redirecting to sign in…</p>
      </div>
    </Bullseye>
  );
};
