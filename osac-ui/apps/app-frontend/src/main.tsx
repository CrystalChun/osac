import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import { ApiProvider } from '@osac/ui-components/api/api-context';
import type { ApiQueryKey } from '@osac/ui-components/api/types';

import { fulfillmentFetch } from './api/fulfillmentFetch';
import App from './App';

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
      refetchInterval: 30_000,
      queryFn: (ctx) => {
        const [route, pathParams, queryParams] = ctx.queryKey as ApiQueryKey;
        return fulfillmentFetch(route, { pathParams, queryParams });
      },
    },
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <ApiProvider fetch={fulfillmentFetch}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ApiProvider>
    </React.StrictMode>,
  );
}
