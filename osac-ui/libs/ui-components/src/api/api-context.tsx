import { createContext, useContext } from 'react';

import type { ApiFetch } from './types';

type ApiContextValue = { fetch: ApiFetch };

const ApiContext = createContext<ApiContextValue | null>(null);

type ApiProviderProps = {
  /**
   * The fetch function created by the app. It must prepend the base URL,
   * add credentials / auth headers, and handle HTTP errors consistently.
   * See README for a reference implementation.
   */
  fetch: ApiFetch;
  children: React.ReactNode;
};

/**
 * Provides the app-level fetch function to all ui-components hooks.
 * Must be rendered above any component that calls useApiFetch().
 *
 * @example
 * <ApiProvider fetch={apiFetch}>
 *   <QueryClientProvider client={queryClient}>
 *     <App />
 *   </QueryClientProvider>
 * </ApiProvider>
 */
export const ApiProvider = ({ fetch, children }: ApiProviderProps) => (
  <ApiContext.Provider value={{ fetch }}>{children}</ApiContext.Provider>
);

/**
 * Returns the typed fetch function from the nearest ApiProvider.
 * Use this inside mutation hooks in ui-components to perform writes
 * without hard-coding the base URL.
 *
 * @example
 * const apiFetch = useApiFetch();
 * return useMutation({
 *   mutationFn: (data) => apiFetch('v1/compute_instances', { method: 'POST', body: data }),
 * });
 */
export const useApiFetch = (): ApiFetch => {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error('useApiFetch must be called inside <ApiProvider>');
  }
  return ctx.fetch;
};
