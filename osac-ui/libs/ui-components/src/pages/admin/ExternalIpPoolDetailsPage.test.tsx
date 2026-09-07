import { Route, Routes } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ExternalIPPool } from '@osac/types/private';
import { ExternalIPPoolState, IPFamily } from '@osac/types/private';

import { ExternalIpPoolDetailsPage } from './ExternalIpPoolDetailsPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const makePool = (
  id: string,
  name: string,
  ipFamily: IPFamily,
  cidrs: string[],
  tenant = 'shared',
): ExternalIPPool =>
  ({
    id,
    metadata: {
      name,
      tenant,
      creationTimestamp: { seconds: BigInt(1700000000), nanos: 0 },
    },
    spec: { cidrs, ipFamily },
    status: {
      state: ExternalIPPoolState.EXTERNAL_IP_POOL_STATE_READY,
      total: 256n,
      allocated: 56n,
      available: 200n,
    },
  }) as ExternalIPPool;

const renderPage = (id: string, pools: ExternalIPPool[]) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/infrastructure/external-ip-pools/:id"
        element={<ExternalIpPoolDetailsPage />}
      />
    </Routes>,
    {
      apiFixtures: { privateExternalIpPools: pools },
      routerEntries: [`/admin/infrastructure/external-ip-pools/${id}`],
    },
  );

describe('ExternalIpPoolDetailsPage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders pool details in overview, capacity, and assignment columns', async () => {
    renderPage('p-1', [makePool('p-1', 'prod-v4', IPFamily.IP_FAMILY_IPV4, ['192.168.1.0/24'])]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'prod-v4' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Capacity' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assignment' })).toBeInTheDocument();
    expect(screen.getByText('Routable address pool for tenant edge exposure.')).toBeInTheDocument();
    expect(screen.queryByText('Name')).not.toBeInTheDocument();
    expect(screen.getByLabelText('External IP pool overview').textContent).toMatch(
      /Status.*Created/s,
    );
    expect(screen.getByText('IPv4')).toBeInTheDocument();
    expect(screen.getByText('200 / 256')).toBeInTheDocument();
    expect(screen.queryByText('Implementation strategy')).not.toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Shared')).toBeInTheDocument();
  });

  it('lists CIDRs under a section without a more button when there are three or fewer', async () => {
    renderPage('p-3', [
      makePool('p-3', 'multi', IPFamily.IP_FAMILY_IPV4, [
        '192.168.1.0/24',
        '10.0.5.0/28',
        '172.16.0.0/24',
      ]),
    ]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'multi' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'CIDRs' })).toBeInTheDocument();
    expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
    expect(screen.getByText('10.0.5.0/28')).toBeInTheDocument();
    expect(screen.getByText('172.16.0.0/24')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument();
  });

  it('shows the tenant id when the pool is not in the shared tenant', async () => {
    renderPage('p-4', [
      makePool('p-4', 'tenant-pool', IPFamily.IP_FAMILY_IPV4, ['10.0.0.0/24'], 'acme'),
    ]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'tenant-pool' })).toBeInTheDocument();
    });
    expect(screen.getByText('acme')).toBeInTheDocument();
    expect(screen.queryByText('Shared')).not.toBeInTheDocument();
  });

  it('renders a not-found state when the pool does not exist', async () => {
    renderPage('missing', [
      makePool('p-1', 'prod-v4', IPFamily.IP_FAMILY_IPV4, ['192.168.1.0/24']),
    ]);

    await waitFor(() => {
      expect(screen.getByText('External IP pool not found')).toBeInTheDocument();
    });
  });

  it('navigates to the edit route when Edit is clicked', async () => {
    const { user } = renderPage('p-1', [
      makePool('p-1', 'prod-v4', IPFamily.IP_FAMILY_IPV4, ['192.168.1.0/24']),
    ]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'prod-v4' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.queryByRole('menuitem', { name: 'View details' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/external-ip-pools/p-1/edit');
  });

  it('navigates to the list after a successful delete', async () => {
    const { user } = renderPage('p-1', [
      makePool('p-1', 'prod-v4', IPFamily.IP_FAMILY_IPV4, ['192.168.1.0/24']),
    ]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'prod-v4' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Delete$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/external-ip-pools');
    });
  });
});
