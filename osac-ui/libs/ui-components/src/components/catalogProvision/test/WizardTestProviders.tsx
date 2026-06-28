import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import type { i18n as I18nInstance } from 'i18next';

import { ApiProvider } from '../../../api/api-context';
import type { ApiFetch } from '../../../api/types';

import { createMockApiFetch, type WizardApiFixtures } from './createMockApiFetch';
import { createTestQueryClient } from './createTestQueryClient';

export type WizardTestProvidersProps = {
  children: ReactNode;
  i18n: I18nInstance;
  apiFixtures?: WizardApiFixtures;
  fetch?: ApiFetch;
};

export const WizardTestProviders = ({
  children,
  apiFixtures,
  fetch: fetchOverride,
}: Omit<WizardTestProvidersProps, 'i18n'>) => {
  const fetch = fetchOverride ?? createMockApiFetch(apiFixtures);
  const queryClient = createTestQueryClient(fetch);

  return (
    <ApiProvider fetch={fetch}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiProvider>
  );
};

export const WizardTestProvidersWithI18n = ({
  children,
  i18n,
  apiFixtures,
  fetch,
}: WizardTestProvidersProps) => (
  <I18nextProvider i18n={i18n}>
    <WizardTestProviders apiFixtures={apiFixtures} fetch={fetch}>
      {children}
    </WizardTestProviders>
  </I18nextProvider>
);
