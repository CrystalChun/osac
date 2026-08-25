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
