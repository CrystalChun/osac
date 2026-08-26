import { Route, Routes } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type DiskImage, DiskImageSchema } from '@osac/types';

import DiskImageActionsMenu from './DiskImageActionsMenu';
import { renderWithProviders } from '../../test-utils/TestProviders';

const makeDiskImage = (id: string): DiskImage =>
  create(DiskImageSchema, {
    id,
    metadata: { name: `disk-image-${id}` },
  });

const renderMenuWithRoutes = (diskImage: DiskImage) =>
  renderWithProviders(
    <Routes>
      <Route
        path="/admin/infrastructure/disk-images"
        element={<DiskImageActionsMenu diskImage={diskImage} />}
      />
      <Route
        path="/admin/infrastructure/disk-images/:id"
        element={<h1>Disk image detail page</h1>}
      />
      <Route
        path="/admin/infrastructure/disk-images/:id/edit"
        element={<h1>Disk image edit page</h1>}
      />
    </Routes>,
    { routerEntries: ['/admin/infrastructure/disk-images'] },
  );

describe('DiskImageActionsMenu', () => {
  it('exposes exactly View and Edit menu items', async () => {
    const { user } = renderMenuWithRoutes(makeDiskImage('di-1'));

    await user.click(screen.getByRole('button', { name: 'Actions for disk-image-di-1' }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'View',
      'Edit',
    ]);
  });

  it('navigates to the detail route when View is selected', async () => {
    const { user } = renderMenuWithRoutes(makeDiskImage('di-1'));

    await user.click(screen.getByRole('button', { name: 'Actions for disk-image-di-1' }));
    await user.click(screen.getByRole('menuitem', { name: 'View' }));

    expect(screen.getByRole('heading', { name: 'Disk image detail page' })).toBeInTheDocument();
  });

  it('navigates to the edit route when Edit is selected', async () => {
    const { user } = renderMenuWithRoutes(makeDiskImage('di-1'));

    await user.click(screen.getByRole('button', { name: 'Actions for disk-image-di-1' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Disk image edit page' })).toBeInTheDocument();
  });
});
