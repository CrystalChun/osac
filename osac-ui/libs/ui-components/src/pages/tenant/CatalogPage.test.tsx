import { Route, Routes } from 'react-router-dom';
import { Code, ConnectError, createRouterTransport } from '@connectrpc/connect';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem, ComputeInstanceCatalogItem } from '@osac/types';
import { ClusterCatalogItems, ComputeInstanceCatalogItems } from '@osac/types';

import CatalogPage from './CatalogPage';
import { wrapWithAuthInterceptor } from '../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../test-utils/TestProviders';

const vmCatalogItem: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'catalog-rhel-9',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'catalog-rhel-9',
    annotations: {},
    creator: 'foo',
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'RHEL 9 catalog',
  description: 'RHEL 9 base image',
  template: 'tpl-rhel-9',
  published: true,
  fieldDefinitions: [
    {
      $typeName: 'osac.public.v1.FieldDefinition',
      path: 'spec.image.source_ref',
      displayName: 'VM image',
      editable: true,
      validationSchema: '',
      default: {
        $typeName: 'google.protobuf.Value',
        kind: { case: 'stringValue', value: 'quay.io/example/rhel9' },
      },
    },
  ],
};

const unpublishedCatalogItem: ClusterCatalogItem = {
  ...vmCatalogItem,
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-unpublished',
  title: 'Unpublished catalog',
  published: false,
};

const clusterCatalogItem: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'catalog-openshift-4',
  metadata: {
    $typeName: 'osac.public.v1.Metadata',
    name: 'catalog-openshift-4',
    creator: 'admin',
    annotations: {},
    labels: {},
    project: 'foo',
    tenant: 'foo',
    version: 1,
  },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type CatalogTransportOptions = {
  vmItems?: ComputeInstanceCatalogItem[];
  clusterItems?: ClusterCatalogItem[];
  vmError?: Error;
  clusterError?: Error;
  vmDelayMs?: number;
  clusterDelayMs?: number;
};

const toConnectError = (error: Error) => {
  if (error.name === 'UnauthorizedError') {
    return new ConnectError('Unauthenticated', Code.Unauthenticated);
  }
  return new ConnectError(error.message, Code.Internal);
};

const createCatalogPageTransport = ({
  vmItems = [vmCatalogItem],
  clusterItems = [clusterCatalogItem],
  vmError,
  clusterError,
  vmDelayMs = 0,
  clusterDelayMs = 0,
}: CatalogTransportOptions = {}) =>
  wrapWithAuthInterceptor(
    createRouterTransport((router) => {
      router.service(ComputeInstanceCatalogItems, {
        list: async () => {
          if (vmDelayMs) {
            await delay(vmDelayMs);
          }
          if (vmError) {
            throw toConnectError(vmError);
          }
          return { items: vmItems };
        },
        get: (req) => ({
          object: vmItems.find((i) => i.id === req.id),
        }),
      });

      router.service(ClusterCatalogItems, {
        list: async () => {
          if (clusterDelayMs) {
            await delay(clusterDelayMs);
          }
          if (clusterError) {
            throw toConnectError(clusterError);
          }
          return { items: clusterItems };
        },
        get: (req) => ({
          object: clusterItems.find((i) => i.id === req.id),
        }),
      });
    }),
  );

const unauthorizedTransport = createCatalogPageTransport({
  vmError: Object.assign(new Error(), { name: 'UnauthorizedError' }),
  clusterError: Object.assign(new Error(), { name: 'UnauthorizedError' }),
});

const renderCatalogPage = (transport = unauthorizedTransport) =>
  renderWithProviders(<CatalogPage />, { transport });

const renderCatalogPageWithCreateRoutes = (transport = createCatalogPageTransport()) =>
  renderWithProviders(
    <Routes>
      <Route path="/catalog" element={<CatalogPage />} />
      <Route path="/clusters/create/:catalogItemId" element={<div>Create cluster page</div>} />
      <Route path="/vms/create/:catalogItemId" element={<div>Create virtual machine page</div>} />
    </Routes>,
    { transport, routerEntries: ['/catalog'] },
  );

describe('CatalogPage', () => {
  it('keeps type filter toggles in the DOM when catalog queries return 401', async () => {
    renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    expect(
      screen.getByRole('group', { name: 'Filter catalog by resource type' }),
    ).toBeInTheDocument();
    expect(document.getElementById('catalog-type-filter-vm')).toBeInTheDocument();
    expect(document.getElementById('catalog-type-filter-cluster')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeInTheDocument();
  });

  it('lets users switch tabs after a 401 on the default VM tab', async () => {
    const { user } = renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clusters' }));

    expect(screen.getByRole('button', { name: 'Clusters' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Clusters', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('disables search while the active tab query is loading', async () => {
    renderCatalogPage(createCatalogPageTransport({ vmDelayMs: 250, clusterItems: [] }));

    const searchInput = screen.getByRole('textbox', { name: 'Filter catalog by keyword' });
    expect(searchInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });
    expect(searchInput).toBeEnabled();
  });

  it('disables search when the active tab query is in error', async () => {
    const { user } = renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Clusters' }));
    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeDisabled();
  });

  it('shows VM catalog items on the default tab when the VM query succeeds', async () => {
    renderCatalogPage(createCatalogPageTransport());

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Virtual Machines', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(clusterCatalogItem.title)).not.toBeInTheDocument();
  });

  it('shows cluster catalog items after switching to the cluster tab', async () => {
    const { user } = renderCatalogPage(createCatalogPageTransport());

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clusters' }));

    await waitFor(() => {
      expect(screen.getByText(clusterCatalogItem.title)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Clusters', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(vmCatalogItem.title)).not.toBeInTheDocument();
  });

  it('shows tab-specific errors without blocking the other tab', async () => {
    const { user } = renderCatalogPage(
      createCatalogPageTransport({
        clusterError: Object.assign(new Error(), { name: 'UnauthorizedError' }),
      }),
    );

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });
    expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clusters' }));

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
    expect(screen.queryByText(clusterCatalogItem.title)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Virtual Machines' }));

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });
    expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
  });

  it('shows a generic section error for non-401 failures', async () => {
    renderCatalogPage(
      createCatalogPageTransport({ vmError: new Error('Catalog service unavailable') }),
    );

    await waitFor(() => {
      expect(screen.getByText('Catalog service unavailable')).toBeInTheDocument();
    });

    expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeDisabled();
  });

  it('shows an empty state when no published catalog items are returned', async () => {
    renderCatalogPage(
      createCatalogPageTransport({ vmItems: [], clusterItems: [unpublishedCatalogItem] }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'No catalog items found', level: 2 }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('No published catalog items are available yet.')).toBeInTheDocument();
  });

  it('filters catalog items by the search keyword on the active tab', async () => {
    const secondVmItem: ComputeInstanceCatalogItem = {
      ...vmCatalogItem,
      id: 'catalog-fedora-40',
      metadata: {
        $typeName: 'osac.public.v1.Metadata',
        name: 'catalog-fedora-40',
        annotations: {},
        creator: 'foo',
        labels: {},
        project: 'foo',
        tenant: 'foo',
        version: 1,
      },
      title: 'Fedora 40 catalog',
      description: 'Fedora 40 workstation image',
    };

    const { user } = renderCatalogPage(
      createCatalogPageTransport({ vmItems: [vmCatalogItem, secondVmItem] }),
    );

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
      expect(screen.getByText(secondVmItem.title)).toBeInTheDocument();
    });

    await user.type(screen.getByRole('textbox', { name: 'Filter catalog by keyword' }), 'fedora');

    await waitFor(() => {
      expect(screen.getByText(secondVmItem.title)).toBeInTheDocument();
    });
    expect(screen.queryByText(vmCatalogItem.title)).not.toBeInTheDocument();
  });

  it('shows a search-specific empty state when the filter matches nothing', async () => {
    const { user } = renderCatalogPage(createCatalogPageTransport());

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    await user.type(
      screen.getByRole('textbox', { name: 'Filter catalog by keyword' }),
      'no-such-catalog-item',
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'No catalog items found', level: 2 }),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('No catalog items match your search.')).toBeInTheDocument();
  });

  it('navigates to cluster create from the catalog item drawer', async () => {
    const { user } = renderCatalogPageWithCreateRoutes();

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Clusters' }));

    await waitFor(() => {
      expect(screen.getByText(clusterCatalogItem.title)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', {
        name: `Open catalog item details for ${clusterCatalogItem.title}`,
      }),
    );
    await user.click(await screen.findByRole('button', { name: 'Create cluster' }));

    await waitFor(() => {
      expect(screen.getByText('Create cluster page')).toBeInTheDocument();
    });
  });

  it('navigates to VM create from the catalog item drawer', async () => {
    const { user } = renderCatalogPageWithCreateRoutes();

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', {
        name: `Open catalog item details for ${vmCatalogItem.title}`,
      }),
    );
    await user.click(await screen.findByRole('button', { name: 'Create virtual machine' }));

    await waitFor(() => {
      expect(screen.getByText('Create virtual machine page')).toBeInTheDocument();
    });
  });
});
