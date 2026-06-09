/**
 * flow: oidc-callback
 * step: Handles the OAuth2/OIDC redirect callback — exchanges the authorization code for tokens
 * via the proxy BFF, then navigates to the application.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bullseye, Spinner, Title } from '@patternfly/react-core';
import { useSession } from '../../contexts/SessionContext';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const { onLoginComplete } = useSession();
  const calledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (calledRef.current) {
      return;
    }
    calledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');
    const errorDescription = params.get('error_description');

    if (errorParam) {
      setError(errorDescription ?? errorParam);
      return;
    }
    if (!code || !state) {
      setError('Missing code or state in callback URL.');
      return;
    }

    fetch(`/api/login?state=${encodeURIComponent(state)}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (resp) => {
        if (!resp.ok) {
          const text = await resp.text().catch(() => '');
          throw new Error(text || `Login failed (HTTP ${resp.status})`);
        }
        const { expiresIn } = (await resp.json()) as { expiresIn: number };
        await onLoginComplete(expiresIn);
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [navigate, onLoginComplete]);

  if (error) {
    return (
      <Bullseye>
        <div>
          <Title headingLevel="h1" size="xl">
            Sign-in failed
          </Title>
          <p>{error}</p>
        </div>
      </Bullseye>
    );
  }

  return (
    <Bullseye>
      <Spinner aria-label="Completing sign-in…" />
    </Bullseye>
  );
};
