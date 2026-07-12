import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';

import type { ClusterCatalogItem } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { CLUSTER_RELEASE_IMAGE_WIRE_PATH } from './fields';
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
    CLUSTER_RELEASE_IMAGE_WIRE_PATH,
    definitions,
    t('Release image'),
  );
  const value = overlayDefaultToFormValue(releaseImageOverlay);
  if (value !== undefined) {
    void helpers.setFieldValue('spec.releaseImage', value);
  }
};
