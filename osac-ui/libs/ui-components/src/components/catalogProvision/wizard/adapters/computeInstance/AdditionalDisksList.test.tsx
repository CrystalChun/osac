import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StorageTierSchema, StorageTierState } from '@osac/types/private';

import { AdditionalDisksList } from './AdditionalDisksList';
import type { ComputeInstanceDiskValues } from './fields';
import { renderWithProviders } from '../../../../../test-utils/TestProviders';

const makeTier = (name: string, displayName: string) =>
  create(StorageTierSchema, {
    id: `id-${name}`,
    metadata: { name, displayName },
    status: { state: StorageTierState.ACTIVE },
  });

const storageTiers = [makeTier('fast', 'Fast SSD'), makeTier('bulk', 'Bulk Capacity')];

const renderList = (
  disks: ComputeInstanceDiskValues[],
  editingIndex: number | null = null,
  overrides: {
    onAdd?: () => void;
    onEdit?: (index: number) => void;
    onDelete?: (index: number) => void;
  } = {},
) => {
  const onAdd = overrides.onAdd ?? vi.fn();
  const onEdit = overrides.onEdit ?? vi.fn();
  const onDelete = overrides.onDelete ?? vi.fn();
  const view = renderWithProviders(
    <AdditionalDisksList
      disks={disks}
      editingIndex={editingIndex}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
    />,
    { apiFixtures: { storageTiers } },
  );
  return { ...view, onAdd, onEdit, onDelete };
};

describe('AdditionalDisksList', () => {
  it('shows an empty state and an Add disk button when there are no disks', () => {
    renderList([]);

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add disk' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a row per disk with size and the resolved tier display name', async () => {
    renderList([{ sizeGib: '50', storageTier: 'fast' }]);

    await waitFor(() => expect(screen.getByText('Fast SSD')).toBeInTheDocument());
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add disk' })).toBeInTheDocument();
  });

  it('falls back to the raw tier name when it does not match a known tier', async () => {
    renderList([{ sizeGib: '50', storageTier: 'unknown-tier' }]);

    await waitFor(() => expect(screen.getByText('unknown-tier')).toBeInTheDocument());
  });

  it('omits the row currently open in the editor', async () => {
    renderList(
      [
        { sizeGib: '50', storageTier: 'fast' },
        { sizeGib: '100', storageTier: 'bulk' },
      ],
      0,
    );

    await waitFor(() => expect(screen.getByText('Bulk Capacity')).toBeInTheDocument());
    expect(screen.queryByText('Fast SSD')).not.toBeInTheDocument();
    expect(screen.queryByText('50')).not.toBeInTheDocument();
  });

  it('reports the original array index, not rendered position, for a row after a hidden one', async () => {
    const { user, onEdit, onDelete } = renderList(
      [
        { sizeGib: '10', storageTier: 'fast' },
        { sizeGib: '20', storageTier: 'bulk' },
        { sizeGib: '30', storageTier: 'fast' },
      ],
      1,
    );

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2));
    // With index 1 hidden, the second rendered row is originally index 2.
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    expect(onEdit).toHaveBeenCalledWith(2);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);
    expect(onDelete).toHaveBeenCalledWith(2);
  });

  it('calls onAdd when the Add disk button is clicked', async () => {
    const { user, onAdd } = renderList([]);

    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('calls onEdit with the row index when Edit is clicked', async () => {
    const { user, onEdit } = renderList([
      { sizeGib: '50', storageTier: 'fast' },
      { sizeGib: '100', storageTier: 'bulk' },
    ]);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(2));
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[1]);

    expect(onEdit).toHaveBeenCalledWith(1);
  });

  it('calls onDelete with the row index when Delete is clicked', async () => {
    const { user, onDelete } = renderList([
      { sizeGib: '50', storageTier: 'fast' },
      { sizeGib: '100', storageTier: 'bulk' },
    ]);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2));
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[1]);

    expect(onDelete).toHaveBeenCalledWith(1);
  });
});
