import { Route, Routes } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  InstanceTypeSchema,
  InstanceTypeState,
  type InstanceType as PrivateInstanceType,
} from '@osac/types/private';
import { mockQueryResult } from '@osac/ui-components/test-utils/query';

import AdminInstanceTypeListPage from './AdminInstanceTypeListPage';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('@osac/ui-components/api/v1/private/instance-type', () => ({
  useAdminInstanceTypes: vi.fn(),
}));

const { useAdminInstanceTypes } = await import('@osac/ui-components/api/v1/private/instance-type');

const longDescription =
  'A provider-curated general-purpose instance type for sustained workloads that need predictable CPU and memory capacity, room for sidecar processes, and enough headroom for bursty background tasks without immediately resizing the virtual machine.';

const makeInstanceType = (
  id: string,
  state: InstanceTypeState,
  description = `${id} description`,
): PrivateInstanceType =>
  create(InstanceTypeSchema, {
    id,
    metadata: {
      name: `instance-type-${id}`,
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
    },
    spec: {
      cores: 4,
      memoryGib: 16,
      description,
      state,
    },
  });

const renderPage = () => renderWithProviders(<AdminInstanceTypeListPage />);

const renderPageWithCreateRoute = () =>
  renderWithProviders(
    <Routes>
      <Route path="/admin/infrastructure/instance-types" element={<AdminInstanceTypeListPage />} />
      <Route
        path="/admin/infrastructure/instance-types/create"
        element={<h1>Create instance type page</h1>}
      />
    </Routes>,
    { routerEntries: ['/admin/infrastructure/instance-types'] },
  );

describe('AdminInstanceTypeListPage', () => {
  it('renders the required columns and lifecycle labels for populated data', () => {
    vi.mocked(useAdminInstanceTypes).mockReturnValue(
      mockQueryResult<PrivateInstanceType[]>({
        data: [
          makeInstanceType('active-1', InstanceTypeState.ACTIVE),
          makeInstanceType('deprecated-1', InstanceTypeState.DEPRECATED),
          makeInstanceType('obsolete-1', InstanceTypeState.OBSOLETE),
          makeInstanceType('long-description-1', InstanceTypeState.ACTIVE, longDescription),
        ],
      }),
    );

    renderPage();

    expect(screen.getByRole('heading', { name: 'Instance types' })).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Lifecycle state',
      'CPU cores',
      'Memory (GiB)',
      'Description',
      'Created',
    ]);
    expect(screen.getByText('instance-type-active-1')).toBeInTheDocument();
    expect(screen.getByText('active-1 description')).toBeInTheDocument();
    const truncatedDescription = Array.from(
      document.querySelectorAll<HTMLElement>('.pf-v6-c-truncate__text'),
    ).find((element) => element.textContent?.startsWith('A provider-curated general-purpose'));
    expect(truncatedDescription).toBeDefined();
    expect(truncatedDescription).not.toBeNull();
    expect(truncatedDescription?.textContent).toContain('A provider-curated');
    expect(truncatedDescription?.closest('.pf-v6-c-truncate')).toHaveClass('pf-m-fixed');
    expect(
      Array.from(document.querySelectorAll<HTMLElement>('.pf-v6-c-truncate__omission')).some(
        (element) => element.textContent === '...',
      ),
    ).toBe(true);
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Deprecated')).toBeInTheDocument();
    expect(screen.getByText('Obsolete')).toBeInTheDocument();
  });

  it('shows a loading spinner while the query is in flight', () => {
    vi.mocked(useAdminInstanceTypes).mockReturnValue(
      mockQueryResult<PrivateInstanceType[]>({
        data: undefined,
        isLoading: true,
      }),
    );

    renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the empty state when no instance types are returned', () => {
    vi.mocked(useAdminInstanceTypes).mockReturnValue(
      mockQueryResult<PrivateInstanceType[]>({
        data: [],
      }),
    );

    renderPage();

    expect(screen.getByText('No instance types yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Create an instance type to start defining provider-managed sizes.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Instance types' })).toBeInTheDocument();
  });

  it('uses the page-level error state when the query fails', () => {
    vi.mocked(useAdminInstanceTypes).mockReturnValue(
      mockQueryResult<PrivateInstanceType[]>({
        data: [],
        error: new Error('Private instance types unavailable'),
      }),
    );

    renderPage();

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
    expect(screen.getByText('Private instance types unavailable')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('navigates to the create route when the create button is clicked', async () => {
    vi.mocked(useAdminInstanceTypes).mockReturnValue(
      mockQueryResult<PrivateInstanceType[]>({
        data: [],
      }),
    );

    const { user } = renderPageWithCreateRoute();

    await user.click(screen.getByRole('button', { name: 'Create instance type' }));

    expect(screen.getByRole('heading', { name: 'Create instance type page' })).toBeInTheDocument();
  });
});
