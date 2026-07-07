import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';

import type { ClusterCatalogItem } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import {
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

export const applyClusterCatalogConfigurationDefaults = (
  catalogItem: ClusterCatalogItem,
  helpers: FormikHelpers<ClusterWizardValues>,
  t: TFunction,
): void => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const releaseImageOverlay = getCatalogFieldOverlay(
    'release_image',
    definitions,
    t('catalogProvision.cluster.fields.releaseImage'),
  );
  const value = overlayDefaultToFormValue(releaseImageOverlay);
  if (value !== undefined) {
    void helpers.setFieldValue('spec.releaseImage', value);
  }
};
