import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { ClusterConfigurationStep } from './ClusterConfigurationStep';
import { createEmptyNodeSetRow } from './fields';
import { createEmptyClusterValues } from './payload';
import { buildClusterStepSchema } from './schemas';
import { FieldValidationProvider } from '../../../../Form/FieldValidationContext';
import { clusterCatalogItem } from '../../../test/fixtures';
import { renderWizardElement } from '../../../test/renderWizard';

const t = (key: string) => key;

describe('ClusterConfigurationStep', () => {
  it('starts with an empty node sets table and add action', async () => {
    renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    await waitFor(() => {
      expect(screen.getByText('No node sets added yet.')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Add node set' })).toBeInTheDocument();
  });

  it('adds a node set row with host type picker and size field', async () => {
    const { user } = await renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Add node set' }));

    await waitFor(() => {
      const table = screen.getByRole('grid', { name: 'Node sets' });
      expect(within(table).getByText('Select host type')).toBeInTheDocument();
      expect(within(table).getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  it('shows pool size validation error when size is zero', async () => {
    const row = createEmptyNodeSetRow();
    await renderWizardElement(
      <FieldValidationProvider value>
        <Formik
          initialValues={{
            ...createEmptyClusterValues(),
            catalogItemId: clusterCatalogItem.id,
            spec: {
              ...createEmptyClusterValues().spec,
              releaseImage: '4.17.0',
              nodeSetRows: [
                {
                  ...row,
                  hostType: { value: 'acme_1tb', label: 'ACME 1TB' },
                  size: '3',
                },
              ],
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
