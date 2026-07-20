import { Route, Routes } from 'react-router-dom';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { Cluster, ClusterCatalogItem, ClustersCreateResponse } from '@osac/types';

import { ClusterCreatePage } from './ClusterCreatePage';
import type { MockApiFixtures } from '../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../test-utils/TestProviders';

const fillClusterGeneralStep = async (
  user: UserEvent,
  name: string,
  pullSecret = '{"auths":{}}',
) => {
  const nameInput = screen.getByLabelText(/^Name/);
  await user.clear(nameInput);
  await user.type(nameInput, name);
  const pullSecretInput = screen.getByLabelText(/Pull secret/);
  fireEvent.change(pullSecretInput, { target: { value: pullSecret } });
};

const fillClusterNodeSetRow = async (user: UserEvent, hostTypeLabel = 'ACME 1TB', size = '3') => {
  await waitFor(() => {
    expect(screen.getByText('Node set 1')).toBeInTheDocument();
  });
  await user.click(screen.getByLabelText(/^Host type/));
  await user.click(screen.getByRole('option', { name: hostTypeLabel }));
  const sizeInput = screen.getByRole('spinbutton', { name: /^Nodes/ });
  await user.clear(sizeInput);
  await user.type(sizeInput, size);
};

const catalogItemGroup = () => screen.getByRole('radiogroup', { name: 'Catalog item' });

const selectCatalogItem = async (user: UserEvent, title: string) => {
  await waitFor(() => {
    expect(within(catalogItemGroup()).getByText(title)).toBeInTheDocument();
  });
  const titleNode = within(catalogItemGroup()).getByText(title);
  const card = titleNode.closest<HTMLElement>('.pf-v6-c-card');
  if (!card) {
    throw new Error(`Catalog card not found for ${title}`);
  }
  await user.click(within(card).getByRole('radio'));
};

const clickWizardNext = async (user: UserEvent) => {
  const [nextButton] = screen.getAllByRole('button', { name: 'Next' });
  await user.click(nextButton);
};

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

const createdCluster: Cluster = {
  $typeName: 'osac.public.v1.Cluster',
  id: 'cluster-1',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'my-cluster',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  spec: {
    $typeName: 'osac.public.v1.ClusterSpec',
    catalogItem: clusterCatalogItem.id,
    nodeSets: {},
    template: '',
    templateParameters: {},
  },
};

const apiFixtures: MockApiFixtures = {
  clusterCatalogItems: [clusterCatalogItem],
  clusterTemplates: [
    {
      $typeName: 'osac.public.v1.ClusterTemplate',
      id: 'tpl-openshift-4',
      metadata: {
        $typeName: 'osac.public.v1.Metadata',
        name: 'tpl-openshift-4',
        annotations: {},
        creator: 'foo',
        labels: {},
        project: 'foo',
        tenant: 'foo',
        version: 1,
      },
      nodeSets: {
        compute: {
          $typeName: 'osac.public.v1.ClusterTemplateNodeSet',
          hostType: 'acme_1tb',
          size: 3,
        },
      },
      description: '',
      parameters: [],
      title: '',
    },
  ],
  hostTypes: [
    {
      $typeName: 'osac.public.v1.HostType',
      id: 'acme_1tb',
      metadata: {
        $typeName: 'osac.public.v1.Metadata',
        name: 'acme_1tb',
        annotations: {},
        creator: 'foo',
        labels: {},
        project: 'foo',
        tenant: 'foo',
        version: 1,
      },
      title: 'ACME 1TB',
      description: '',
      interfaces: [],
    },
    {
      $typeName: 'osac.public.v1.HostType',
      id: 'acme_1tb_h100',
      metadata: {
        $typeName: 'osac.public.v1.Metadata',
        name: 'acme_1tb_h100',
        annotations: {},
        creator: 'foo',
        labels: {},
        project: 'foo',
        tenant: 'foo',
        version: 1,
      },
      title: 'ACME 1TB H100',
      description: '',
      interfaces: [],
    },
  ],
};

describe('ClusterCreatePage', () => {
  it('navigates to cluster details after successful create', async () => {
    const onClusterCreate = vi.fn((): ClustersCreateResponse => {
      return {
        $typeName: 'osac.public.v1.ClustersCreateResponse',
        object: createdCluster,
      };
    });

    const { user } = renderWithProviders(
      <Routes>
        <Route path="/clusters/create" element={<ClusterCreatePage />} />
        <Route
          path="/clusters/:clusterId"
          element={<div>Cluster details {createdCluster.id}</div>}
        />
      </Routes>,
      {
        routerEntries: ['/clusters/create'],
        apiFixtures,
        transportOverrides: { onClusterCreate },
      },
    );

    await selectCatalogItem(user, clusterCatalogItem.title);
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
