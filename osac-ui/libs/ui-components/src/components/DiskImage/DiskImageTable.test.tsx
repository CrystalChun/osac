import { Route, Routes } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  Architecture,
  type DiskImage,
  DiskImageLifecycle,
  DiskImageSchema,
  GuestOSFamily,
} from '@osac/types';

import DiskImageTable from './DiskImageTable';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeDiskImage = (overrides: {
  id: string;
  name?: string;
  tenant?: string;
  guestOsFamily?: GuestOSFamily;
  architecture?: Architecture[];
  lifecycle?: DiskImageLifecycle;
}): DiskImage =>
  create(DiskImageSchema, {
    id: overrides.id,
    metadata: {
      name: overrides.name ?? `disk-image-${overrides.id}`,
      tenant: overrides.tenant,
      creationTimestamp: { seconds: BigInt(1717000000), nanos: 0 },
    },
    spec: {
      sourceRef: `quay.io/example/${overrides.id}:latest`,
      guestOsFamily: overrides.guestOsFamily ?? GuestOSFamily.GUEST_OS_FAMILY_LINUX,
      architecture: overrides.architecture ?? [Architecture.AMD64],
      lifecycle: overrides.lifecycle ?? DiskImageLifecycle.AVAILABLE,
    },
  });

const renderTableWithRoutes = (diskImages: DiskImage[]) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/infrastructure/disk-images"
        element={<DiskImageTable diskImages={diskImages} />}
      />
      <Route
        path="/admin/infrastructure/disk-images/:id"
        element={<h1>Disk image detail page</h1>}
      />
    </Routes>,
    { routerEntries: ['/admin/infrastructure/disk-images'] },
  );

describe('DiskImageTable', () => {
  it('renders the required columns', () => {
    renderTableWithRoutes([
      makeDiskImage({
        id: 'global-1',
        architecture: [Architecture.AMD64, Architecture.ARM64],
      }),
    ]);

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Name',
      'Guest OS family',
      'Architecture',
      'Lifecycle',
      'Scope',
      'Created',
      '',
    ]);
    expect(screen.getByRole('button', { name: 'disk-image-global-1' })).toBeInTheDocument();
    expect(screen.getByText('amd64')).toBeInTheDocument();
    expect(screen.getByText('arm64')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Linux')).toBeInTheDocument();
  });

  it('shows Global scope when metadata.tenant is empty', () => {
    renderTableWithRoutes([makeDiskImage({ id: 'global-1' })]);

    expect(screen.getByText('Global')).toBeInTheDocument();
  });

  it('shows Tenant scope when metadata.tenant is set', () => {
    renderTableWithRoutes([makeDiskImage({ id: 'tenant-1', tenant: 'tenant-a' })]);

    expect(screen.getByText('Tenant')).toBeInTheDocument();
  });

  it('navigates to the detail route when the name is clicked', async () => {
    const { user } = renderTableWithRoutes([makeDiskImage({ id: 'di-1' })]);

    await user.click(screen.getByRole('button', { name: 'disk-image-di-1' }));

    expect(screen.getByRole('heading', { name: 'Disk image detail page' })).toBeInTheDocument();
  });

  it('shows the empty state when no disk images are returned', () => {
    renderTableWithRoutes([]);

    expect(screen.getByText('No disk images yet.')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'Disk images' })).toBeInTheDocument();
  });
});
