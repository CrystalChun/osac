# API Query Architecture

## Overview

The API layer is split across two concerns:

- **`ui-components`** — declares *what* to fetch/write using typed hooks. It never contains fetch logic, base URLs, or credentials.
- **The app** (e.g. `app-frontend`) — owns the `QueryClient` and `ApiProvider`, which together define *how* a route is turned into an HTTP request.

This separation means any hook from `ui-components` works in any app that supplies a compatible `ApiProvider` and `QueryClient`, without touching the hook itself.

---

## `ApiRoute`

Every resource route is listed in the `ApiRoute` union in `types.ts`. Using an unknown string anywhere a route is expected is a **compile error**. When adding a new resource, register its route here first.

```ts
export type ApiRoute =
  | 'v1/compute_instances'
  | // add new routes here
```

---

## Reads — `useApiQuery` and `ApiQueryKey`

`ApiQueryKey` encodes the full address of a read request as a 3-part tuple:

```ts
export type ApiQueryKey = [
  baseUrl: ApiRoute,                         // [0] must be a known ApiRoute
  pathParams?: (string | number)[] | null,   // [1] dynamic path segments, e.g. ['abc123']
  queryParams?: Record<string, ...>          // [2] query-string params, e.g. { limit: 20 }
];
```

`useApiQuery` is a thin wrapper around TanStack's `useQuery` that enforces `ApiQueryKey` as the key type. `queryFn` is omitted from its options — the app's `QueryClient` default `queryFn` handles all fetching by interpreting the tuple.

The `queryFn` in `app-frontend/main.tsx` delegates to the same `apiFetch` function used by mutations:

```
[route, pathParams, queryParams]
  → /api/fulfillment/<route>/<pathParams...>?<queryParams>
  → fetched with credentials: 'include'
```

Examples:

| `queryKey` | Resulting URL |
|---|---|
| `['v1/compute_instances', null, { limit: 20 }]` | `/api/fulfillment/v1/compute_instances?limit=20` |
| `['v1/compute_instances', ['abc-123']]` | `/api/fulfillment/v1/compute_instances/abc-123` |

### Default `QueryClient` settings

| Option | Value | Rationale |
|---|---|---|
| `staleTime` | 5 s | Short window to avoid redundant re-fetches on mount |
| `refetchInterval` | 30 s | Background polling for out-of-band changes |
| `refetchOnMount` | `true` | Always validate on component mount |
| `retry` | 1 | One retry on transient network errors |

---

## Writes — `useApiFetch` and `ApiFetch`

For mutations, hooks call `useApiFetch()` to obtain a typed fetch function from the nearest `ApiProvider`. The function accepts a known `ApiRoute` and options; the app fills in the base URL.

```ts
export type ApiFetch = <T = unknown>(route: ApiRoute, options?: ApiFetchOptions) => Promise<T>;

export type ApiFetchOptions = {
  pathParams?: (string | number)[] | null;   // appended as path segments
  queryParams?: Record<string, ...>;         // serialised as query string
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; // default: 'GET'
  body?: unknown;                            // serialised to JSON
};
```

Usage in a mutation hook:

```ts
import { useApiFetch } from '../api-context';
import { useMutation } from '@tanstack/react-query';

export const useCreateComputeInstance = () => {
  const apiFetch = useApiFetch();
  return useMutation({
    mutationFn: (data: CreateComputeInstanceInput) =>
      apiFetch('v1/compute_instances', { method: 'POST', body: data }),
  });
};

export const useDeleteComputeInstance = () => {
  const apiFetch = useApiFetch();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch('v1/compute_instances', { pathParams: [id], method: 'DELETE' }),
  });
};
```

---

## Adding a new resource

### 1. Register the route

Add the route to `ApiRoute` in `types.ts`:

```ts
export type ApiRoute =
  | 'v1/compute_instances'
  | 'v1/some_resources'; // new
```

### 2. Add query and mutation hooks

Create `libs/ui-components/src/api/v1/<resource>.ts`:

```ts
import { SomeResource, SomeResourceListResponse } from '@osac/types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';
import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useMutation } from '@tanstack/react-query';

export type ListSomeResourcesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

// List query
export const useSomeResources = (params: ListSomeResourcesParams = {}) =>
  useApiQuery<SomeResourceListResponse, SomeResource[]>({
    queryKey: ['v1/some_resources', null, params],
    select: (data) => data.items,
  });

// Single-item query
export const useSomeResource = (id: string) =>
  useApiQuery<SomeResource>({
    queryKey: ['v1/some_resource', [id]],
  });

// Create mutation
export const useCreateSomeResource = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (data: Partial<SomeResource>) =>
      apiFetch('v1/some_resources', { method: 'POST', body: data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: apiQueryKey('v1/some_resources') }),
  });
};
```

Key rules:

1. **`ApiRoute` first** — add the route to `types.ts` before writing any hook.
2. **Reads use `useApiQuery`** — no `queryFn`, the app's `QueryClient` handles fetching.
3. **Writes use `useApiFetch`** — call `useApiFetch()` to get the fetch function; never import `fetch` directly.
4. **Cache operations use `useApiQueryClient` + `apiQueryKey`** — never pass raw string keys to `invalidateQueries` etc.
5. **`select`** — unwrap `.items` or transform the response here, not in the component.

---

## Existing resource hooks

| File | Exports |
|---|---|
| `v1/compute-instance.ts` | `useComputeInstances`, `useComputeInstance`, `useProvisionComputeInstance`, `usePatchComputeInstance`, `useDeleteComputeInstance`, `invalidateComputeInstancesQueries` |
| `v1/compute-instance-wire.ts` | `buildComputeInstanceCreateBody`, `buildComputeInstancePowerPatchBody` (inline wire JSON builders) |

---

## App-level setup (`main.tsx`)

The app is responsible for:

1. **Creating `apiFetch`** — a function that prepends the base URL, adds credentials/auth headers, serialises the body, and throws on non-OK responses.
2. **Passing it to `ApiProvider`** — so mutation hooks can retrieve it via `useApiFetch()`.
3. **Using it in the `QueryClient` default `queryFn`** — so read hooks get the same base URL and error handling.

```tsx
const apiFetch: ApiFetch = async (route, options = {}) => {
  const { pathParams, queryParams, method = 'GET', body } = options;
  // ... build URL from route + pathParams + queryParams ...
  const res = await fetch(`${API_BASE}/${path}`, {
    credentials: 'include', method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: (ctx) => {
        const [route, pathParams, queryParams] = ctx.queryKey as ApiQueryKey;
        return apiFetch(route, { pathParams, queryParams });
      },
    },
  },
});

// Render:
<ApiProvider fetch={apiFetch}>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
</ApiProvider>
```

An app targeting a different backend only needs to replace `apiFetch` — all `ui-components` hooks continue to work unchanged.
