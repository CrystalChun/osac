import type { FormikHelpers } from 'formik';
import { describe, expect, it, vi } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { applyVmCatalogConfigurationDefaults } from './applyCatalogDefaults';
import type { ComputeInstanceWizardValues } from './fields';
import { tIdentity as t } from '../../../../../test-utils/i18n';

const makeCatalogItem = (storageTierDefault: unknown): ComputeInstanceCatalogItem =>
  ({
    $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
    id: 'catalog-rhel-9',
    fieldDefinitions: [
      {
        $typeName: 'osac.public.v1.FieldDefinition',
        path: 'spec.boot_disk.storage_tier',
        displayName: 'Storage tier',
        editable: true,
        validationSchema: '',
        ...(storageTierDefault !== undefined ? { default: storageTierDefault } : {}),
      },
    ],
  }) as unknown as ComputeInstanceCatalogItem;

describe('applyVmCatalogConfigurationDefaults', () => {
  it('seeds spec.bootDisk.storageTier from the catalog field default', () => {
    const setFieldValue = vi.fn();
    const catalogItem = makeCatalogItem({
      $typeName: 'google.protobuf.Value',
      kind: { case: 'stringValue', value: 'bulk' },
    });

    applyVmCatalogConfigurationDefaults(
      catalogItem,
      { setFieldValue } as unknown as FormikHelpers<ComputeInstanceWizardValues>,
      t,
    );

    expect(setFieldValue).toHaveBeenCalledWith('spec.bootDisk.storageTier', 'bulk');
  });

  it('does not set a default when the storage tier field has none', () => {
    const setFieldValue = vi.fn();

    applyVmCatalogConfigurationDefaults(
      makeCatalogItem(undefined),
      { setFieldValue } as unknown as FormikHelpers<ComputeInstanceWizardValues>,
      t,
    );

    expect(setFieldValue).not.toHaveBeenCalledWith('spec.bootDisk.storageTier', expect.anything());
  });
});
