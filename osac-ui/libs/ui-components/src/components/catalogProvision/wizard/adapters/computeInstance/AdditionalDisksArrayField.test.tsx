import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import { StorageTierSchema, StorageTierState } from '@osac/types';

import { AdditionalDisksArrayField } from './AdditionalDisksArrayField';
import { createEmptyComputeInstanceValues } from './payload';
import { renderWithProviders } from '../../../../../test-utils/TestProviders';

const makeTier = (name: string, displayName: string) =>
  create(StorageTierSchema, {
    id: `id-${name}`,
    metadata: { name, displayName },
    status: { state: StorageTierState.ACTIVE },
  });

const storageTiers = [makeTier('fast', 'Fast SSD'), makeTier('bulk', 'Bulk Capacity')];

const selectTier = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  comboboxIndex: number,
  optionName: RegExp,
) => {
  const combobox = screen.getAllByRole('combobox')[comboboxIndex];
  await user.click(combobox);
  await user.click(await screen.findByRole('option', { name: optionName }));
};

const renderField = (initialDisks: { sizeGib: string; storageTier: string }[] = []) =>
  renderWithProviders(
    <Formik
      initialValues={{
        ...createEmptyComputeInstanceValues(),
        spec: { ...createEmptyComputeInstanceValues().spec, additionalDisks: initialDisks },
      }}
      onSubmit={() => undefined}
    >
      <AdditionalDisksArrayField />
    </Formik>,
    { apiFixtures: { publicStorageTiers: storageTiers } },
  );

describe('AdditionalDisksArrayField', () => {
  it('shows no rows and an Add disk action when there are no additional disks', () => {
    renderField();

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add disk' })).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('appends a live, editable row with a default size when Add disk is clicked', async () => {
    const { user } = renderField();

    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    expect(screen.queryByText('No additional disks added.')).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Size (GiB)' })).toHaveValue(30);
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
  });

  it('adds a second row alongside the first, each independently editable', async () => {
    const { user } = renderField();

    await user.click(screen.getByRole('button', { name: 'Add disk' }));
    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInputs).toHaveLength(2);

    await user.clear(sizeInputs[0]);
    await user.type(sizeInputs[0], '50');
    await user.clear(sizeInputs[1]);
    await user.type(sizeInputs[1], '100');

    expect(sizeInputs[0]).toHaveValue(50);
    expect(sizeInputs[1]).toHaveValue(100);
  });

  it('lets each row pick its own storage tier independently', async () => {
    const { user } = renderField();

    await user.click(screen.getByRole('button', { name: 'Add disk' }));
    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    await waitFor(() => expect(screen.getAllByRole('combobox')).toHaveLength(2));
    await selectTier(user, 0, /Fast SSD/);
    await selectTier(user, 1, /Bulk Capacity/);

    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes[0]).toHaveValue('Fast SSD (default)');
    expect(comboboxes[1]).toHaveValue('Bulk Capacity');
  });

  it('removes a row when its Remove action is clicked', async () => {
    const { user } = renderField();

    await user.click(screen.getByRole('button', { name: 'Add disk' }));
    await user.click(screen.getByRole('button', { name: 'Remove disk' }));

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('keeps the remaining row intact when a different row is removed', async () => {
    const { user } = renderField();

    await user.click(screen.getByRole('button', { name: 'Add disk' }));
    const sizeInputs1 = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    await user.clear(sizeInputs1[0]);
    await user.type(sizeInputs1[0], '77');

    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    await user.click(screen.getAllByRole('button', { name: 'Remove disk' })[1]);

    const remaining = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toHaveValue(77);
  });

  it('renders a row already present in initial values (e.g. seeded from a catalog default) as editable and removable', async () => {
    const { user } = renderField([{ sizeGib: '40', storageTier: 'fast' }]);

    expect(screen.queryByText('No additional disks added.')).not.toBeInTheDocument();
    const sizeInput = screen.getByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInput).toHaveValue(40);
    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('Fast SSD (default)'));

    await user.clear(sizeInput);
    await user.type(sizeInput, '60');
    expect(sizeInput).toHaveValue(60);

    await user.click(screen.getByRole('button', { name: 'Remove disk' }));
    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
  });
});
