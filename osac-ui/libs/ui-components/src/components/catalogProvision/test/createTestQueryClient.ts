import { QueryClient } from '@tanstack/react-query';

import type { ApiFetch } from '../../../api/types';
import type { ApiQueryKey, ApiQueryMeta } from '../../../api/types';

export const createTestQueryClient = (fetch: ApiFetch): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchInterval: false,
        queryFn: (ctx) => {
          const [route, pathParams, queryParams] = ctx.queryKey as ApiQueryKey;
          const { decode } = (ctx.meta ?? {}) as ApiQueryMeta;
          return fetch(route, { pathParams, queryParams, decode });
        },
      },
    },
  });
