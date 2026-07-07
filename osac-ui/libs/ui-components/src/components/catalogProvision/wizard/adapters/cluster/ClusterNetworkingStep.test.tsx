import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ClusterNetworkingStep } from './ClusterNetworkingStep';
import { createEmptyClusterValues } from './payload';
import { clusterCatalogItem } from '../../../test/fixtures';
import { renderWizardElement } from '../../../test/renderWizard';

describe('ClusterNetworkingStep', () => {
  it('renders optional pod and service CIDR fields', async () => {
    await renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterNetworkingStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    expect(screen.getByLabelText(/Pod CIDR/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Service CIDR/)).toBeInTheDocument();
  });

  it('accepts CIDR input values', async () => {
    const user = userEvent.setup();
    await renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterNetworkingStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    const podCidr = screen.getByLabelText(/Pod CIDR/);
    await user.type(podCidr, '10.128.0.0/14');
    expect(podCidr).toHaveValue('10.128.0.0/14');
  });
});
