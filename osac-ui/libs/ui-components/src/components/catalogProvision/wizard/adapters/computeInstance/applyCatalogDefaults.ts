import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import type { ComputeInstanceDiskValues, ComputeInstanceWizardValues } from './fields';
import { fieldDefinitionDefaultToInputString } from '../../../catalogFieldDefinition';
import {
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

const setDefault = (
  helpers: FormikHelpers<ComputeInstanceWizardValues>,
  path: string,
  value: unknown,
): void => {
  if (value !== undefined) {
    void helpers.setFieldValue(path, value);
  }
};

const additionalDisksOverlayToFormValue = (
  value: unknown,
): ComputeInstanceDiskValues[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.map((entry) => {
    const record = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
    return {
      sizeGib: fieldDefinitionDefaultToInputString(record.size_gib),
      storageTier: fieldDefinitionDefaultToInputString(record.storage_tier),
    };
  });
};

/** Apply catalog overlay defaults once when a catalog item is selected. */
export const applyVmCatalogConfigurationDefaults = (
  catalogItem: ComputeInstanceCatalogItem,
  helpers: FormikHelpers<ComputeInstanceWizardValues>,
  t: TFunction,
): void => {
  const definitions = readCatalogFieldDefinitions(catalogItem);

  const imageOverlay = getCatalogFieldOverlay(
    'spec.image.source_ref',
    definitions,
    t('catalogProvision.vm.fields.image'),
  );
  const userDataOverlay = getCatalogFieldOverlay(
    'spec.user_data',
    definitions,
    t('catalogProvision.vm.fields.userData'),
  );
  const bootDiskOverlay = getCatalogFieldOverlay(
    'spec.boot_disk.size_gib',
    definitions,
    t('catalogProvision.vm.fields.bootDisk'),
  );
  const storageTierOverlay = getCatalogFieldOverlay(
    'spec.boot_disk.storage_tier',
    definitions,
    t('Storage tier'),
  );
  const additionalDisksOverlay = getCatalogFieldOverlay(
    'spec.additional_disks',
    definitions,
    t('Additional disks'),
  );

  setDefault(helpers, 'spec.image.sourceRef', overlayDefaultToFormValue(imageOverlay));
  setDefault(helpers, 'spec.userData', overlayDefaultToFormValue(userDataOverlay));
  setDefault(helpers, 'spec.bootDisk.sizeGib', overlayDefaultToFormValue(bootDiskOverlay) ?? '');
  setDefault(helpers, 'spec.bootDisk.storageTier', overlayDefaultToFormValue(storageTierOverlay));
  setDefault(
    helpers,
    'spec.additionalDisks',
    additionalDisksOverlayToFormValue(additionalDisksOverlay.defaultValue),
  );
};
