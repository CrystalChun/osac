import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ClusterConfigurationStep } from './ClusterConfigurationStep';
import { createEmptyClusterValues } from './payload';
import { clusterCatalogItem } from '../../../test/fixtures';
import { renderWizardElement } from '../../../test/renderWizard';

describe('ClusterConfigurationStep', () => {
  it('shows empty template warning when template has no node sets', async () => {
    renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
      {
        apiFixtures: {
          clusterTemplates: {
            [clusterCatalogItem.template]: {
              id: clusterCatalogItem.template,
              metadata: { name: clusterCatalogItem.template },
              nodeSets: {},
            },
          },
        },
      },
    );

    await waitFor(() => {
      expect(screen.getByText('No worker pools in template')).toBeInTheDocument();
    });
    expect(screen.getByText('No worker pools defined in the template.')).toBeInTheDocument();
  });

  it('renders worker pool table with host type and size fields', async () => {
    const { user } = await renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    await waitFor(() => {
      expect(screen.getByText('compute')).toBeInTheDocument();
      expect(screen.getByText('ACME 1TB')).toBeInTheDocument();
    });

    const sizeInput = screen.getByLabelText(/^Size/);
    expect(sizeInput).toHaveValue(3);
    await user.clear(sizeInput);
    await user.type(sizeInput, '5');
    expect(sizeInput).toHaveValue(5);
  });
});
