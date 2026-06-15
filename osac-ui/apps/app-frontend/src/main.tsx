import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { ApiProvider } from '@osac/ui-components/api/api-context';
import type { ApiFetch, ApiQueryKey } from '@osac/ui-components/api/types';

import App from './App';

// CSS load order is intentional: base → addons → local overrides
/* eslint-disable import/order */
import '@patternfly/patternfly/patternfly.css';
import '@patternfly/patternfly/patternfly-addons.css';
import './global.css';
/* eslint-enable import/order */

const API_BASE = '/api/fulfillment';

/**
 * Shared fetch implementation used by both the QueryClient default queryFn
 * (reads) and the ApiProvider (writes via useApiFetch in mutation hooks).
 *
 * Callers supply a known ApiRoute and optional path/query params; this
 * function constructs the full URL and handles credentials and HTTP errors.
 */
const apiFetch: ApiFetch = async (route, options = {}) => {
  const { pathParams, queryParams, method = 'GET', body } = options;

  let path: string = route;

  if (Array.isArray(pathParams)) {
    const segment = pathParams.filter((p) => p !== undefined && p !== null).join('/');
    if (segment) {
      path = `${path}/${segment}`;
    }
  }

  if (queryParams) {
    const cleanParams = Object.fromEntries(
      Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== null),
    );
    const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString();
    if (queryString) {
      path = `${path}?${queryString}`;
    }
  }

  const res = await fetch(`${API_BASE}/${path}`, {
    credentials: 'include',
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return res.json();
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Short stale window deduplicates fetches when multiple components
      // mounting on the same page request the same query simultaneously.
      staleTime: 5_000,
      refetchOnMount: true,
      refetchInterval: 30_000,
      queryFn: (ctx) => {
        const [route, pathParams, queryParams] = ctx.queryKey as ApiQueryKey;
        return apiFetch(route, { pathParams, queryParams });
      },
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ApiProvider fetch={apiFetch}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ApiProvider>
    </React.StrictMode>,
  );
}
