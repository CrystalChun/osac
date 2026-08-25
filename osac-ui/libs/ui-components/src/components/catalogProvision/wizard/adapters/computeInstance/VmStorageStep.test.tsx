import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { describe, expect, it } from 'vitest';

import {
  type ComputeInstanceCatalogItem,
  ComputeInstanceTemplateReferenceSchema,
} from '@osac/types';
import { StorageTierSchema, StorageTierState } from '@osac/types/private';

import { createEmptyComputeInstanceValues } from './payload';
import { VmStorageStep } from './VmStorageStep';
import { renderWithProviders } from '../../../../../test-utils/TestProviders';

const makeTier = (name: string, displayName: string) =>
  create(StorageTierSchema, {
    id: `id-${name}`,
    metadata: { name, displayName },
    status: { state: StorageTierState.ACTIVE },
  });

const makeCatalogItem = (
  storageTierFieldDefinition?: Record<string, unknown>,
): ComputeInstanceCatalogItem =>
  ({
    $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
    id: 'catalog-rhel-9',
    metadata: {
      $typeName: 'osac.public.v1.Metadata',
      name: 'catalog-rhel-9',
      annotations: {},
      labels: {},
    },
    title: 'RHEL 9 catalog',
    description: 'RHEL 9 base image',
    template: create(ComputeInstanceTemplateReferenceSchema, {
      id: 'tpl-rhel-9',
      name: 'tpl-rhel-9',
    }),
    published: true,
    fieldDefinitions: storageTierFieldDefinition ? [storageTierFieldDefinition] : [],
  }) as unknown as ComputeInstanceCatalogItem;

const renderStep = (catalogItem: ComputeInstanceCatalogItem, storageTier = '') =>
  renderWithProviders(
    <Formik
      initialValues={{
        ...createEmptyComputeInstanceValues(),
        spec: {
          ...createEmptyComputeInstanceValues().spec,
          bootDisk: { sizeGib: '', storageTier },
        },
      }}
      onSubmit={() => undefined}
    >
      <VmStorageStep catalogItem={catalogItem} />
    </Formik>,
    {
      apiFixtures: {
        storageTiers: [makeTier('other', 'Other'), makeTier('fast', 'Fast SSD')],
      },
    },
  );

// applyVmCatalogConfigurationDefaults (covered separately in applyCatalogDefaults.test.ts) is what
// actually seeds the tier on catalog selection — VmStorageStep only renders whatever value Formik
// already holds, so these tests seed `storageTier` directly to simulate the post-selection state.
describe('VmStorageStep', () => {
  it('shows a catalog-seeded default as editable when the field allows editing', async () => {
    renderStep(
      makeCatalogItem({
        $typeName: 'osac.public.v1.FieldDefinition',
        path: 'spec.boot_disk.storage_tier',
        displayName: 'Storage tier',
        editable: true,
        validationSchema: '',
      }),
      'fast',
    );

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('Fast SSD'));
    expect(screen.queryByText('Locked by catalog')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox').closest('[disabled]')).toBeNull();
  });

  it('renders the tier read-only with a lock badge when the catalog locks it', async () => {
    renderStep(
      makeCatalogItem({
        $typeName: 'osac.public.v1.FieldDefinition',
        path: 'spec.boot_disk.storage_tier',
        displayName: 'Storage tier',
        editable: false,
        validationSchema: '',
      }),
      'fast',
    );

    await waitFor(() => expect(screen.getByRole('combobox')).toHaveValue('Fast SSD'));
    expect(screen.getByText('Locked by catalog')).toBeInTheDocument();
    expect(screen.getByRole('combobox').closest('[disabled]')).not.toBeNull();
  });

  it('leaves the tier picker editable and unset when the catalog defines no default', async () => {
    renderStep(makeCatalogItem());

    await waitFor(() => expect(screen.getByRole('combobox').closest('[disabled]')).toBeNull());
    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.queryByText('Locked by catalog')).not.toBeInTheDocument();
  });
});

const selectAdditionalDiskTier = async (
  user: ReturnType<typeof renderStep>['user'],
  optionName: RegExp,
) => {
  const comboboxes = screen.getAllByRole('combobox');
  await user.click(comboboxes[comboboxes.length - 1]);
  await user.click(await screen.findByRole('option', { name: optionName }));
};

const addDisk = async (
  user: ReturnType<typeof renderStep>['user'],
  size: string,
  tierOptionName: RegExp,
) => {
  await user.click(screen.getByRole('button', { name: 'Add disk' }));
  const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
  await user.clear(sizeInputs[sizeInputs.length - 1]);
  await user.type(sizeInputs[sizeInputs.length - 1], size);
  await selectAdditionalDiskTier(user, tierOptionName);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: 'Add' }));
};

describe('VmStorageStep — additional disks', () => {
  it('starts with an empty list and no editor open', () => {
    renderStep(makeCatalogItem());

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add disk' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('opens the editor pre-filled with the default size and no tier when Add disk is clicked', async () => {
    const { user } = renderStep(makeCatalogItem());

    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInputs[sizeInputs.length - 1]).toHaveValue(30);
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  it('appends a row showing size and tier, and closes the editor, on confirm', async () => {
    const { user } = renderStep(makeCatalogItem());

    await addDisk(user, '30', /Fast SSD/);

    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('Fast SSD')).toBeInTheDocument();
  });

  it('disables Add disk while the editor is already open, preventing a second draft row', async () => {
    const { user } = renderStep(makeCatalogItem());

    await user.click(screen.getByRole('button', { name: 'Add disk' }));

    expect(screen.getByRole('button', { name: 'Add disk' })).toBeDisabled();
  });

  it('disables Edit on other rows while the editor is already open, preventing silent data loss', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '10', /Other/);
    await addDisk(user, '20', /Fast SSD/);

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    await user.clear(sizeInputs[sizeInputs.length - 1]);
    await user.type(sizeInputs[sizeInputs.length - 1], '77');

    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
  });

  it('discards the draft and leaves the list empty when Cancel is clicked while adding', async () => {
    const { user } = renderStep(makeCatalogItem());

    await user.click(screen.getByRole('button', { name: 'Add disk' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('reopens the editor in edit mode and hides the row from the list while open', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '30', /Fast SSD/);

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInputs[sizeInputs.length - 1]).toHaveValue(30);
    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
  });

  it('restores the original values when Cancel is clicked while editing', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '30', /Fast SSD/);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    await user.clear(sizeInputs[sizeInputs.length - 1]);
    await user.type(sizeInputs[sizeInputs.length - 1], '99');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.queryByText('99')).not.toBeInTheDocument();
    expect(screen.getByText('Fast SSD')).toBeInTheDocument();
  });

  it('updates the row in place when Save is clicked while editing', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '30', /Fast SSD/);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    await user.clear(sizeInputs[sizeInputs.length - 1]);
    await user.type(sizeInputs[sizeInputs.length - 1], '99');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByText('99')).toBeInTheDocument();
    expect(screen.queryByText('30')).not.toBeInTheDocument();
  });

  it('removes a row when Delete is clicked', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '30', /Fast SSD/);

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
  });

  it('keeps the open editor bound to the same disk when a later row is deleted', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '10', /Other/);
    await addDisk(user, '20', /Fast SSD/);

    // Open the editor for the first disk (index 0), then delete the second disk
    // (index 1, after the one being edited) via its still-visible row.
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInputs[sizeInputs.length - 1]).toHaveValue(10);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('shifts the open editor down when an earlier row is deleted', async () => {
    const { user } = renderStep(makeCatalogItem());
    await addDisk(user, '10', /Other/);
    await addDisk(user, '20', /Fast SSD/);

    // Open the editor for the second disk (index 1), then delete the first disk
    // (index 0, before the one being edited) via its still-visible row.
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[1]);
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByText('No additional disks added.')).toBeInTheDocument();
    const sizeInputs = screen.getAllByRole('spinbutton', { name: 'Size (GiB)' });
    expect(sizeInputs[sizeInputs.length - 1]).toHaveValue(20);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Fast SSD')).toBeInTheDocument();
  });
});
