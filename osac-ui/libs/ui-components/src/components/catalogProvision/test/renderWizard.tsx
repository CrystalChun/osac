import type { ReactElement } from 'react';
import { type RenderOptions, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { CatalogProvisionKind } from '../catalogFieldDefinition';
import type { CatalogProvisionPayload } from '../catalogProvisionTypes';
import { CatalogProvisionWizard } from '../CatalogProvisionWizard';
import { type WizardApiFixtures } from './createMockApiFetch';
import { initTestI18n } from './i18n';
import { WizardTestProvidersWithI18n } from './WizardTestProviders';
import type { ApiFetch } from '../../../api/types';

export type RenderWizardOptions = {
  kind?: CatalogProvisionKind;
  initialCatalogItemId?: string;
  apiFixtures?: WizardApiFixtures;
  fetch?: ApiFetch;
  onProvision?: (payload: CatalogProvisionPayload) => void | Promise<void>;
  onClosed?: () => void;
} & Omit<RenderOptions, 'wrapper'>;

export const renderWizard = async (options: RenderWizardOptions = {}) => {
  const i18n = await initTestI18n();
  const onProvision = options.onProvision ?? vi.fn();
  const onClosed = options.onClosed ?? vi.fn();

  const view = render(
    <CatalogProvisionWizard
      kind={options.kind || 'compute_instance'}
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
