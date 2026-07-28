import type { ReactElement, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';
import type { Transport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, type RenderResult, render, renderHook } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';

import {
  type MockApiFixtures,
  type MockTransportOverrides,
  createMockConnectTransport,
} from './createMockConnectTransport';
import en from '../../../i18n/locales/en/translation.json';
import { ApiProvider } from '../api/api-context';
import { SessionProvider } from '../hooks/use-session';
import type { DemoShellRole } from '../shellTypes';

const createTestI18n = () => {
  const instance = i18n.createInstance();
  instance.init({
    initImmediate: false,
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { translation: en } },
    interpolation: { escapeValue: false },
  });
  return instance;
};

export type TestProvidersProps = {
  children: ReactNode;
  apiFixtures?: MockApiFixtures;
  transport?: Transport;
  transportOverrides?: MockTransportOverrides;
  routerEntries?: string[];
};

export const TestProviders = ({
  children,
  apiFixtures,
  transport: transportOverride,
  transportOverrides,
  routerEntries,
}: TestProvidersProps) => {
  const i18nInstance = createTestI18n();
  const transport =
    transportOverride ?? createMockConnectTransport(apiFixtures, transportOverrides);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, refetchInterval: false },
    },
  });

  return (
    <MemoryRouter initialEntries={routerEntries}>
      <I18nextProvider i18n={i18nInstance}>
        <ApiProvider transport={transport}>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ApiProvider>
      </I18nextProvider>
    </MemoryRouter>
  );
};

export type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  apiFixtures?: MockApiFixtures;
  transport?: Transport;
  transportOverrides?: MockTransportOverrides;
  routerEntries?: string[];
};

export type RenderWithProvidersResult = RenderResult & {
  user: UserEvent;
};

export const renderWithProviders = (
  ui: ReactElement,
  options: RenderWithProvidersOptions = {},
): RenderWithProvidersResult => {
  const { apiFixtures, transport, transportOverrides, routerEntries, ...renderOptions } = options;

  const view = render(ui, {
    wrapper: ({ children }) => (
      <TestProviders
        apiFixtures={apiFixtures}
        transport={transport}
        transportOverrides={transportOverrides}
        routerEntries={routerEntries}
      >
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  });

  return { ...view, user: userEvent.setup() };
};

export type RenderHookWithProvidersOptions = {
  role: DemoShellRole;
  transport: Transport;
  username?: string;
};

/** Renders a hook wrapped in `SessionProvider` + `ApiProvider` + a fresh `QueryClient` — for testing
 * role-aware hooks (e.g. admin catalog-item hooks) against a mock Connect transport. */
export const renderHookWithProviders = <TResult,>(
  hook: () => TResult,
  { role, transport, username = 'test-user' }: RenderHookWithProvidersOptions,
) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider role={role} username={username}>
      <ApiProvider transport={transport}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ApiProvider>
    </SessionProvider>
  );
  return { ...renderHook(hook, { wrapper }), queryClient };
};
