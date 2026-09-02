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

const makePool = (id: string, name: string, ipFamily: IPFamily, cidrs: string[]): ExternalIPPool =>
  ({
    id,
    metadata: { name },
    spec: { cidrs, ipFamily, implementationStrategy: 'metallb-l2' },
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

  it('renders pool details and capacity', async () => {
    renderPage('p-1', [makePool('p-1', 'prod-v4', IPFamily.IP_FAMILY_IPV4, ['192.168.1.0/24'])]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'prod-v4' })).toBeInTheDocument();
    });
    expect(screen.getByText('IPv4')).toBeInTheDocument();
    expect(screen.getByText('200 / 256')).toBeInTheDocument();
    expect(screen.getByText('metallb-l2')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('lists every CIDR in the CIDRs card', async () => {
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
    expect(screen.getByText('192.168.1.0/24')).toBeInTheDocument();
    expect(screen.getByText('10.0.5.0/28')).toBeInTheDocument();
    expect(screen.getByText('172.16.0.0/24')).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /^Edit$/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/external-ip-pools/p-1/edit');
  });

  it('navigates to the list after a successful delete', async () => {
    const { user } = renderPage('p-1', [
      makePool('p-1', 'prod-v4', IPFamily.IP_FAMILY_IPV4, ['192.168.1.0/24']),
    ]);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'prod-v4' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /^Delete$/i }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Delete$/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/infrastructure/external-ip-pools');
    });
  });
});
