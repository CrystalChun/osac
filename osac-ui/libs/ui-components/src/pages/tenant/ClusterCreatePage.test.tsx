import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ClusterCreatePage } from './ClusterCreatePage';
import { clusterCatalogItem } from '../../components/catalogProvision/test/fixtures';
import { initTestI18n } from '../../components/catalogProvision/test/i18n';
import {
  clickWizardNext,
  fillClusterGeneralStep,
  fillClusterNodeSetRow,
  selectClusterCatalogItem,
} from '../../components/catalogProvision/test/wizardFlow.helpers';
import { WizardTestProvidersWithI18n } from '../../components/catalogProvision/test/WizardTestProviders';

const createdCluster = {
  id: 'cluster-1',
  metadata: { name: 'my-cluster' },
  spec: { catalogItem: clusterCatalogItem.id },
};

describe('ClusterCreatePage', () => {
  it('navigates to cluster details after successful create', async () => {
    const i18n = await initTestI18n();
    const onClusterCreate = vi.fn(() => createdCluster);

    render(
      <MemoryRouter initialEntries={['/clusters/create']}>
        <Routes>
          <Route path="/clusters/create" element={<ClusterCreatePage />} />
          <Route
            path="/clusters/:clusterId"
            element={<div>Cluster details {createdCluster.id}</div>}
          />
        </Routes>
      </MemoryRouter>,
      {
        wrapper: ({ children }) => (
          <WizardTestProvidersWithI18n i18n={i18n} transportOverrides={{ onClusterCreate }}>
            {children}
          </WizardTestProvidersWithI18n>
        ),
      },
    );

    const user = userEvent.setup();
    await selectClusterCatalogItem(user);
    await clickWizardNext(user);
    await fillClusterGeneralStep(user, 'my-cluster');
    await clickWizardNext(user);
    await waitFor(() => {
      expect(screen.getByLabelText(/Release image/)).toBeInTheDocument();
    });
    await fillClusterNodeSetRow(user);
    await clickWizardNext(user);
    await clickWizardNext(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText(`Cluster details ${createdCluster.id}`)).toBeInTheDocument();
    });

    expect(onClusterCreate).toHaveBeenCalledTimes(1);
  });
});
