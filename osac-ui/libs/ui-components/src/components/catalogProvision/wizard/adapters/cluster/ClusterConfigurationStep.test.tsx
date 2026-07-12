import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import ClusterConfigurationStep from './ClusterConfigurationStep';
import { createEmptyNodeSetRow } from './fields';
import { createEmptyClusterValues } from './payload';
import { buildClusterStepSchema } from './schemas';
import { FieldValidationProvider } from '../../../../Form/FieldValidationContext';
import { clusterCatalogItem } from '../../../test/fixtures';
import { renderWizardElement } from '../../../test/renderWizard';

const t = (key: string) => key;

describe('ClusterConfigurationStep', () => {
  it('starts with one node set and add action', async () => {
    renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    await waitFor(() => {
      expect(screen.getByText('Node set 1')).toBeInTheDocument();
      expect(screen.getByText('Select host type')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name: /^Nodes/ })).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: 'Remove node set' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add node set' })).toBeInTheDocument();
  });

  it('adds another node set row when Add node set is clicked', async () => {
    const { user } = await renderWizardElement(
      <Formik initialValues={createEmptyClusterValues()} onSubmit={() => undefined}>
        <ClusterConfigurationStep catalogItem={clusterCatalogItem} />
      </Formik>,
    );

    await user.click(screen.getByRole('button', { name: 'Add node set' }));

    await waitFor(() => {
      expect(screen.getByText('Node set 2')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove node set' })).toBeInTheDocument();
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
