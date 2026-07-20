import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createConnectTransport } from '@connectrpc/connect-web';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { ApiProvider, connectErrorInterceptor } from '@osac/ui-components/api/api-context';

import App from './App';
import './i18n';

const connectTransport = createConnectTransport({
  baseUrl: '/api/fulfillment',
  interceptors: [connectErrorInterceptor],
});

// CSS load order is intentional: base → addons → local overrides
/* eslint-disable import/order */
import '@patternfly/patternfly/patternfly.css';
import '@patternfly/patternfly/patternfly-addons.css';
import './global.css';
/* eslint-enable import/order */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Short stale window deduplicates fetches when multiple components
      // mounting on the same page request the same query simultaneously.
      staleTime: 5_000,
      refetchOnMount: true,
      refetchInterval: 10_000,
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ApiProvider transport={connectTransport}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ApiProvider>
    </React.StrictMode>,
  );
}
