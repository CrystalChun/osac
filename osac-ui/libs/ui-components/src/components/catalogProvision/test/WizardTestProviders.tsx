import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { Transport } from '@connectrpc/connect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { i18n as I18nInstance } from 'i18next';

import { type WizardApiFixtures } from './createMockApiFetch';
import {
  type MockTransportOverrides,
  createMockConnectTransport,
} from './createMockConnectTransport';
import { ApiProvider } from '../../../api/api-context';

export type WizardTestProvidersProps = {
  children: ReactNode;
  i18n: I18nInstance;
  apiFixtures?: WizardApiFixtures;
  transport?: Transport;
  transportOverrides?: MockTransportOverrides;
};

export const WizardTestProviders = ({
  children,
  apiFixtures,
  transport: transportOverride,
  transportOverrides,
}: Omit<WizardTestProvidersProps, 'i18n'>) => {
  const transport =
    transportOverride ?? createMockConnectTransport(apiFixtures, transportOverrides);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false, refetchInterval: false },
    },
  });

  return (
    <ApiProvider transport={transport}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiProvider>
  );
};

export const WizardTestProvidersWithI18n = ({
  children,
  i18n,
  apiFixtures,
  transport,
  transportOverrides,
}: WizardTestProvidersProps) => (
  <I18nextProvider i18n={i18n}>
    <WizardTestProviders
      apiFixtures={apiFixtures}
      transport={transport}
      transportOverrides={transportOverrides}
    >
      {children}
    </WizardTestProviders>
  </I18nextProvider>
);
