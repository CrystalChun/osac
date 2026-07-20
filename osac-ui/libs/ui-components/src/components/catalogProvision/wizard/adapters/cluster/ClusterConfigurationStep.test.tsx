import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';
import { tIdentity } from '@osac/ui-components/test-utils/i18n';

import ClusterConfigurationStep from './ClusterConfigurationStep';
import { createEmptyNodeSetRow } from './fields';
import { createEmptyClusterValues } from './payload';
import { buildClusterStepSchema } from './schemas';
import { renderWithProviders } from '../../../../../test-utils/TestProviders';
import { FieldValidationProvider } from '../../../../Form/FieldValidationContext';

const clusterCatalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-openshift-4',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'catalog-openshift-4',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'release_image',
      displayName: 'Release image',
      editable: true,
      validationSchema: '',
      default: {
        $typeName: 'google.protobuf.Value',
        kind: { case: 'stringValue', value: '4.17.0' },
      },
    },
  ],
};

describe('ClusterConfigurationStep', () => {
  it('starts with one node set and add action', async () => {
    renderWithProviders(
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
    const { user } = renderWithProviders(
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
    renderWithProviders(
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
          validationSchema={buildClusterStepSchema(clusterCatalogItem, 'configuration', tIdentity)}
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
