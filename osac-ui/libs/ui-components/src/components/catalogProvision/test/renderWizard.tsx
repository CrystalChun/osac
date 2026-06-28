import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { vi } from 'vitest';

import type { BuildComputeInstanceCreateBodyInput } from '../../../api/v1/compute-instance-wire';
import { CatalogProvisionWizard } from '../CatalogProvisionWizard';

import { type WizardApiFixtures, createMockApiFetch } from './createMockApiFetch';
import { initTestI18n } from './i18n';
import { WizardTestProvidersWithI18n } from './WizardTestProviders';
import type { ApiFetch } from '../../../api/types';

export type RenderWizardOptions = {
  initialCatalogItemId?: string;
  apiFixtures?: WizardApiFixtures;
  fetch?: ApiFetch;
  onProvision?: (payload: BuildComputeInstanceCreateBodyInput) => void | Promise<void>;
  onClosed?: () => void;
} & Omit<RenderOptions, 'wrapper'>;

export const renderWizard = async (options: RenderWizardOptions = {}) => {
  const i18n = await initTestI18n();
  const onProvision = options.onProvision ?? vi.fn();
  const onClosed = options.onClosed ?? vi.fn();

  const view = render(
    <CatalogProvisionWizard
      initialCatalogItemId={options.initialCatalogItemId}
      onProvision={onProvision}
      onClosed={onClosed}
    />,
    {
      wrapper: ({ children }) => (
        <WizardTestProvidersWithI18n
          i18n={i18n}
          apiFixtures={options.apiFixtures}
          fetch={options.fetch}
        >
          {children}
        </WizardTestProvidersWithI18n>
      ),
      ...options,
    },
  );

  return {
    ...view,
    i18n,
    onProvision,
    onClosed,
    user: userEvent.setup(),
  };
};

export const renderWizardElement = async (
  ui: ReactElement,
  options: Omit<RenderWizardOptions, 'onProvision' | 'onClosed' | 'initialCatalogItemId'> = {},
) => {
  const i18n = await initTestI18n();

  const view = render(ui, {
    wrapper: ({ children }) => (
      <WizardTestProvidersWithI18n i18n={i18n} apiFixtures={options.apiFixtures}>
        {children}
      </WizardTestProvidersWithI18n>
    ),
    ...options,
  });

  return { ...view, i18n, user: userEvent.setup() };
};
