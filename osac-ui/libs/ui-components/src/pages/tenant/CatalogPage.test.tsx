import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import type { ClusterCatalogItem, ComputeInstanceCatalogItem } from '@osac/types';
import {
  ClusterCatalogItemsListResponseSchema,
  ComputeInstanceCatalogItemsListResponseSchema,
} from '@osac/types';

import { CatalogPage } from './CatalogPage';
import { decodeFulfillmentResponse } from '../../api/fulfillment-decode';
import type { ApiFetch, ApiRoute } from '../../api/types';
import {
  unpublishedCatalogItem,
  vmCatalogItem,
} from '../../components/catalogProvision/test/fixtures';
import { initTestI18n } from '../../components/catalogProvision/test/i18n';
import { WizardTestProvidersWithI18n } from '../../components/catalogProvision/test/WizardTestProviders';
import { UnauthorizedError } from '../../utils/unauthorizedError';

const clusterCatalogItem = {
  id: 'catalog-openshift-4',
  metadata: { name: 'catalog-openshift-4' },
  title: 'OpenShift 4 cluster',
  description: 'Standard OpenShift cluster offering',
  template: 'tpl-openshift-4',
  published: true,
  fieldDefinitions: [],
} as unknown as ClusterCatalogItem;

type CatalogFetchHandlers = {
  vmItems?: ComputeInstanceCatalogItem[];
  clusterItems?: ClusterCatalogItem[];
  vmError?: Error;
  clusterError?: Error;
  vmDelayMs?: number;
  clusterDelayMs?: number;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createCatalogPageFetch =
  ({
    vmItems = [vmCatalogItem],
    clusterItems = [clusterCatalogItem],
    vmError,
    clusterError,
    vmDelayMs = 0,
    clusterDelayMs = 0,
  }: CatalogFetchHandlers = {}): ApiFetch =>
  async (route: ApiRoute, options = {}) => {
    const { decode } = options;

    switch (route) {
      case 'v1/compute_instance_catalog_items':
        await delay(vmDelayMs);
        if (vmError) {
          throw vmError;
        }
        return decodeFulfillmentResponse(decode ?? ComputeInstanceCatalogItemsListResponseSchema, {
          items: vmItems,
        });
      case 'v1/cluster_catalog_items':
        await delay(clusterDelayMs);
        if (clusterError) {
          throw clusterError;
        }
        return decodeFulfillmentResponse(decode ?? ClusterCatalogItemsListResponseSchema, {
          items: clusterItems,
        });
      default:
        throw new Error(`Unexpected API route in CatalogPage test: ${route}`);
    }
  };

const unauthorizedCatalogFetch = createCatalogPageFetch({
  vmError: new UnauthorizedError(),
  clusterError: new UnauthorizedError(),
});

const renderCatalogPage = async (fetch: ApiFetch = unauthorizedCatalogFetch) => {
  const i18n = await initTestI18n();
  const view = render(
    <MemoryRouter>
      <WizardTestProvidersWithI18n i18n={i18n} fetch={fetch}>
        <CatalogPage />
      </WizardTestProvidersWithI18n>
    </MemoryRouter>,
  );

  return { ...view, user: userEvent.setup() };
};

const renderCatalogPageWithCreateRoutes = async (fetch: ApiFetch = createCatalogPageFetch()) => {
  const i18n = await initTestI18n();
  const view = render(
    <MemoryRouter initialEntries={['/catalog']}>
      <WizardTestProvidersWithI18n i18n={i18n} fetch={fetch}>
        <Routes>
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/clusters/create/:catalogItemId" element={<div>Create cluster page</div>} />
          <Route
            path="/vms/create/:catalogItemId"
            element={<div>Create virtual machine page</div>}
          />
        </Routes>
      </WizardTestProvidersWithI18n>
    </MemoryRouter>,
  );

  return { ...view, user: userEvent.setup() };
};

describe('CatalogPage', () => {
  it('keeps type filter toggles in the DOM when catalog queries return 401', async () => {
    await renderCatalogPage();

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
    const { user } = await renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    await user.click(document.getElementById('catalog-type-filter-cluster')!);

    expect(document.getElementById('catalog-type-filter-cluster')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('heading', { name: 'Clusters', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('disables search while the active tab query is loading', async () => {
    await renderCatalogPage(createCatalogPageFetch({ vmDelayMs: 250, clusterItems: [] }));

    const searchInput = screen.getByRole('textbox', { name: 'Filter catalog by keyword' });
    expect(searchInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });
    expect(searchInput).toBeEnabled();
  });

  it('disables search when the active tab query is in error', async () => {
    const { user } = await renderCatalogPage();

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });

    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeDisabled();

    await user.click(document.getElementById('catalog-type-filter-cluster')!);
    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeDisabled();
  });

  it('shows VM catalog items on the default tab when the VM query succeeds', async () => {
    await renderCatalogPage(createCatalogPageFetch());

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    expect(screen.getByRole('heading', { name: 'Virtual machines', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(clusterCatalogItem.title)).not.toBeInTheDocument();
  });

  it('shows cluster catalog items after switching to the cluster tab', async () => {
    const { user } = await renderCatalogPage(createCatalogPageFetch());

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    await user.click(document.getElementById('catalog-type-filter-cluster')!);

    await waitFor(() => {
      expect(screen.getByText(clusterCatalogItem.title)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Clusters', level: 2 })).toBeInTheDocument();
    expect(screen.queryByText(vmCatalogItem.title)).not.toBeInTheDocument();
  });

  it('shows tab-specific errors without blocking the other tab', async () => {
    const { user } = await renderCatalogPage(
      createCatalogPageFetch({ clusterError: new UnauthorizedError() }),
    );

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });
    expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();

    await user.click(document.getElementById('catalog-type-filter-cluster')!);

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
    expect(screen.queryByText(clusterCatalogItem.title)).not.toBeInTheDocument();

    await user.click(document.getElementById('catalog-type-filter-vm')!);

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });
    expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
  });

  it('shows a generic section error for non-401 failures', async () => {
    await renderCatalogPage(
      createCatalogPageFetch({ vmError: new Error('Catalog service unavailable') }),
    );

    await waitFor(() => {
      expect(screen.getByText('Catalog service unavailable')).toBeInTheDocument();
    });

    expect(screen.queryByText('Unauthorized')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Filter catalog by keyword' })).toBeDisabled();
  });

  it('shows an empty state when no published catalog items are returned', async () => {
    await renderCatalogPage(
      createCatalogPageFetch({ vmItems: [], clusterItems: [unpublishedCatalogItem] }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'No catalog items found', level: 2 }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText('No published catalog items are available yet.')).toBeInTheDocument();
  });

  it('filters catalog items by the search keyword on the active tab', async () => {
    const secondVmItem = {
      ...vmCatalogItem,
      id: 'catalog-fedora-40',
      metadata: { name: 'catalog-fedora-40' },
      title: 'Fedora 40 catalog',
      description: 'Fedora 40 workstation image',
    } as unknown as ComputeInstanceCatalogItem;

    const { user } = await renderCatalogPage(
      createCatalogPageFetch({ vmItems: [vmCatalogItem, secondVmItem] }),
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
    const { user } = await renderCatalogPage(createCatalogPageFetch());

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
    const { user } = await renderCatalogPageWithCreateRoutes();

    await waitFor(() => {
      expect(screen.getByText(vmCatalogItem.title)).toBeInTheDocument();
    });

    await user.click(document.getElementById('catalog-type-filter-cluster')!);

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
    const { user } = await renderCatalogPageWithCreateRoutes();

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
