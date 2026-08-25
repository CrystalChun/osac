import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import { StorageTierSchema, StorageTierState } from '@osac/types/private';

import { AdditionalDiskEditor } from './AdditionalDiskEditor';
import { createEmptyComputeInstanceValues } from './payload';
import { renderWithProviders } from '../../../../../test-utils/TestProviders';

const makeTier = (name: string, displayName: string) =>
  create(StorageTierSchema, {
    id: `id-${name}`,
    metadata: { name, displayName },
    status: { state: StorageTierState.ACTIVE },
  });

const storageTiers = [makeTier('fast', 'Fast SSD')];

const renderEditor = (
  mode: 'add' | 'edit',
  initialDisk: { sizeGib: string; storageTier: string },
  overrides: { onConfirm?: () => void; onCancel?: () => void; index?: number } = {},
) => {
  const onConfirm = overrides.onConfirm ?? vi.fn();
  const onCancel = overrides.onCancel ?? vi.fn();
  const view = renderWithProviders(
    <Formik
      initialValues={{
        ...createEmptyComputeInstanceValues(),
        spec: {
          ...createEmptyComputeInstanceValues().spec,
          additionalDisks: [initialDisk],
        },
      }}
      onSubmit={() => undefined}
    >
      <AdditionalDiskEditor
        index={overrides.index ?? 0}
        mode={mode}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </Formik>,
    { apiFixtures: { storageTiers } },
  );
  return { ...view, onConfirm, onCancel };
};

describe('AdditionalDiskEditor', () => {
  it('disables confirm when size is below 1 and no tier is selected', async () => {
    renderEditor('add', { sizeGib: '0', storageTier: '' });

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('enables confirm when size is at least 1 and a tier is selected', async () => {
    renderEditor('add', { sizeGib: '30', storageTier: 'fast' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
  });

  it('enables confirm at the exact minimum size of 1', async () => {
    renderEditor('add', { sizeGib: '1', storageTier: 'fast' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
  });

  it('disables confirm when size exceeds the maximum of 16384', async () => {
    renderEditor('add', { sizeGib: '16385', storageTier: 'fast' });

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('disables confirm when size is fractional', async () => {
    renderEditor('add', { sizeGib: '30.5', storageTier: 'fast' });

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('disables confirm and does not throw when the bound index is out of range', () => {
    expect(() =>
      renderEditor('add', { sizeGib: '30', storageTier: 'fast' }, { index: 5 }),
    ).not.toThrow();
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('labels the confirm button "Save" in edit mode', async () => {
    renderEditor('edit', { sizeGib: '30', storageTier: 'fast' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });

  it('renders the size input with min, max, and step constraints', () => {
    renderEditor('add', { sizeGib: '30', storageTier: '' });

    const sizeInput = screen.getByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInput).toHaveAttribute('min', '1');
    expect(sizeInput).toHaveAttribute('max', '16384');
    expect(sizeInput).toHaveAttribute('step', '1');
  });

  it('calls onConfirm when the confirm button is clicked', async () => {
    const { user, onConfirm } = renderEditor('add', { sizeGib: '30', storageTier: 'fast' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    const { user, onCancel } = renderEditor('add', { sizeGib: '0', storageTier: '' });

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
