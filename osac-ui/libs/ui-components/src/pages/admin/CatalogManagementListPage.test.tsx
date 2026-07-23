import { Route, Routes } from 'react-router-dom';
import { createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem, ComputeInstanceCatalogItem } from '@osac/types';
import {
  BareMetalInstanceCatalogItems,
  ClusterCatalogItems,
  ComputeInstanceCatalogItems,
} from '@osac/types';
import type {
  ClusterCatalogItem as PrivateClusterCatalogItem,
  ComputeInstanceCatalogItem as PrivateComputeInstanceCatalogItem,
} from '@osac/types/private';
import {
  BareMetalInstanceCatalogItems as PrivateBareMetalInstanceCatalogItems,
  ClusterCatalogItems as PrivateClusterCatalogItems,
  ComputeInstanceCatalogItems as PrivateComputeInstanceCatalogItems,
} from '@osac/types/private';

import CatalogManagementListPage from './CatalogManagementListPage';
import { SessionProvider } from '../../hooks/use-session';
import { renderWithProviders } from '../../test-utils/TestProviders';

const privateClusterItem: PrivateClusterCatalogItem = {
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'cluster-private-1',
  title: 'OpenShift 4 cluster',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

const publicClusterItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'cluster-public-1',
  title: 'Shared OpenShift cluster',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'shared-cluster',
    annotations: {},
    creator: 'admin',
    labels: {},
    project: '',
    tenant: 'shared',
    version: 1,
  },
};

const publicUnpublishedVmItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'vm-public-1',
  title: 'Fedora workstation',
  description: '',
  template: '',
  published: false,
  fieldDefinitions: [],
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'fedora',
    annotations: {},
    creator: 'tenant-admin',
    labels: {},
    project: '',
    tenant: 'acme-corp',
    version: 1,
  },
};

const privateVmItem: PrivateComputeInstanceCatalogItem = {
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  id: 'vm-private-1',
  title: 'RHEL 9 workstation',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

const emptyList = () => ({ items: [] });

const createTestTransport = (options: { onUpdate?: (req: unknown) => void } = {}) =>
  createRouterTransport((router) => {
    router.service(PrivateClusterCatalogItems, {
      list: () => ({ items: [privateClusterItem] }),
      update: (req) => {
        options.onUpdate?.(req);
        return { object: privateClusterItem };
      },
    });
    router.service(ClusterCatalogItems, {
      list: () => ({ items: [publicClusterItem] }),
      update: (req) => {
        options.onUpdate?.(req);
        return { object: publicClusterItem };
      },
    });
    router.service(PrivateComputeInstanceCatalogItems, {
      list: () => ({ items: [privateVmItem] }),
    });
    router.service(ComputeInstanceCatalogItems, {
      list: () => ({ items: [publicUnpublishedVmItem] }),
      update: (req) => {
        options.onUpdate?.(req);
        return { object: publicUnpublishedVmItem };
      },
    });
    router.service(PrivateBareMetalInstanceCatalogItems, { list: emptyList });
    router.service(BareMetalInstanceCatalogItems, { list: emptyList });
  });

const renderPage = (role: 'providerAdmin' | 'tenantAdmin', transport = createTestTransport()) =>
  renderWithProviders(
    <SessionProvider role={role} username="test-user">
      <Routes>
        <Route path="/admin/catalog" element={<CatalogManagementListPage />} />
        <Route path="/admin/catalog/:type/create" element={<div>create-page</div>} />
        <Route path="/admin/catalog/:type/:id" element={<div>detail-page</div>} />
      </Routes>
    </SessionProvider>,
    { transport, routerEntries: ['/admin/catalog'] },
  );

describe('CatalogManagementListPage', () => {
  it('renders the three resource type tabs', () => {
    renderPage('providerAdmin');
    expect(screen.getByRole('tab', { name: 'Clusters' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Virtual Machines' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Bare Metal' })).toBeInTheDocument();
  });

  it('shows the CSP Admin (private API) items with an organization scope badge on the default tab', async () => {
    renderPage('providerAdmin');
    await waitFor(() => {
      expect(screen.getByText(privateClusterItem.title)).toBeInTheDocument();
    });
    expect(screen.getByText('Organization: acme-corp')).toBeInTheDocument();
  });

  it('shows the Tenant Admin (public API) items on the default tab', async () => {
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText(publicClusterItem.title)).toBeInTheDocument();
    });
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('switches tabs and shows the newly active tab items', async () => {
    const { user } = renderPage('tenantAdmin');

    await waitFor(() => {
      expect(screen.getByText(publicClusterItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Virtual Machines' }));

    await waitFor(() => {
      expect(screen.getByText(publicUnpublishedVmItem.title)).toBeInTheDocument();
    });
  });

  it('shows an empty state on a tab with no catalog items', async () => {
    const { user } = renderPage('providerAdmin');

    await waitFor(() => {
      expect(screen.getByText(privateClusterItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Bare Metal' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'No catalog items found', level: 2 }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('No catalog items have been created yet.')).toBeInTheDocument();
  });

  it('filters items by search keyword', async () => {
    const { user } = renderPage('providerAdmin');

    await waitFor(() => {
      expect(screen.getByText(privateClusterItem.title)).toBeInTheDocument();
    });

    await user.type(
      screen.getByRole('textbox', { name: 'Filter catalog by keyword' }),
      'no-such-item',
    );

    await waitFor(() => {
      expect(screen.queryByText(privateClusterItem.title)).not.toBeInTheDocument();
    });
  });

  it('filters items by publication status', async () => {
    const { user } = renderPage('tenantAdmin');

    await user.click(screen.getByRole('tab', { name: 'Virtual Machines' }));
    await waitFor(() => {
      expect(screen.getByText(publicUnpublishedVmItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Published' }));

    await waitFor(() => {
      expect(screen.queryByText(publicUnpublishedVmItem.title)).not.toBeInTheDocument();
    });
  });

  it('navigates to the kind-specific create route when Create is clicked', async () => {
    const { user } = renderPage('providerAdmin');

    await waitFor(() => {
      expect(screen.getByText(privateClusterItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('create-page')).toBeInTheDocument();
    });
  });

  it('navigates to the detail route when a card is clicked', async () => {
    const { user } = renderPage('providerAdmin');

    await waitFor(() => {
      expect(screen.getByText(privateClusterItem.title)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', {
        name: `Open catalog item details for ${privateClusterItem.title}`,
      }),
    );

    await waitFor(() => {
      expect(screen.getByText('detail-page')).toBeInTheDocument();
    });
  });

  it('disables the publish toggle for a Tenant Admin viewing a general item', async () => {
    renderPage('tenantAdmin');
    await waitFor(() => {
      expect(screen.getByText(publicClusterItem.title)).toBeInTheDocument();
    });
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('sends an update when the publish toggle is used by a CSP Admin', async () => {
    let lastReq: unknown;
    const { user } = renderPage(
      'providerAdmin',
      createTestTransport({
        onUpdate: (req) => {
          lastReq = req;
        },
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(privateClusterItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('switch'));

    await waitFor(() => {
      expect(lastReq).toMatchObject({
        object: { id: privateClusterItem.id, published: false },
        updateMask: { paths: ['published'] },
      });
    });
  });
});
