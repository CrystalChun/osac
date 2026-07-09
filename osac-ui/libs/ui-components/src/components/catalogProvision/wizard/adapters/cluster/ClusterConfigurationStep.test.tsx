import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ClusterConfigurationStep } from './ClusterConfigurationStep';
import { createEmptyClusterValues } from './payload';
import { buildClusterStepSchema } from './schemas';
import { FieldValidationProvider } from '../../../../Form/FieldValidationContext';
import { clusterCatalogItem } from '../../../test/fixtures';
import { renderWizardElement } from '../../../test/renderWizard';

const t = (key: string) => key;

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
      expect(screen.getByText('No node sets in template')).toBeInTheDocument();
    });
    expect(screen.getByText('No node sets defined in the template.')).toBeInTheDocument();
  });

  it('renders node sets table with host type and size fields', async () => {
    const { user } = await renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    await waitFor(() => {
      expect(screen.getByText('compute')).toBeInTheDocument();
      expect(screen.getByText('ACME 1TB')).toBeInTheDocument();
    });

    const sizeInput = screen.getByRole('spinbutton');
    expect(sizeInput).toHaveValue(3);
    await user.clear(sizeInput);
    await user.type(sizeInput, '5');
    expect(sizeInput).toHaveValue(5);
  });

  it('shows pool size validation error when size is zero', async () => {
    await renderWizardElement(
      <FieldValidationProvider value>
        <Formik
          initialValues={{
            ...createEmptyClusterValues(),
            catalogItemId: clusterCatalogItem.id,
            spec: {
              ...createEmptyClusterValues().spec,
              releaseImage: '4.17.0',
              nodeSets: {
                compute: { hostType: { value: 'acme_1tb', label: '' }, size: '3' },
              },
            },
          }}
          validationSchema={buildClusterStepSchema(clusterCatalogItem, 'configuration', t)}
          validateOnBlur
          onSubmit={() => undefined}
        >
          <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
        </Formik>
      </FieldValidationProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    const sizeInput = screen.getByRole('spinbutton');
    fireEvent.change(sizeInput, { target: { value: '0' } });
    fireEvent.blur(sizeInput);

    await waitFor(() => {
      expect(screen.getByText('Pool size must be greater than zero')).toBeInTheDocument();
    });
  });
});
