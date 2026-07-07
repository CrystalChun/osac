import type { FormikHelpers } from 'formik';
import type { TFunction } from 'i18next';

import type { ClusterCatalogItem } from '@osac/types';

import type { ClusterWizardValues } from './fields';
import { clusterSshKeyWirePath } from './generalFields';
import {
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

export const applyClusterCatalogGeneralDefaults = (
  catalogItem: ClusterCatalogItem,
  helpers: FormikHelpers<ClusterWizardValues>,
  t: TFunction,
): void => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const sshKeyOverlay = getCatalogFieldOverlay(
    clusterSshKeyWirePath,
    definitions,
    t('catalogProvision.cluster.fields.sshKey'),
  );
  const pullSecretOverlay = getCatalogFieldOverlay(
    'pull_secret',
    definitions,
    t('catalogProvision.cluster.fields.pullSecret'),
  );

  if (sshKeyOverlay.defaultValue !== undefined) {
    const value = overlayDefaultToFormValue(sshKeyOverlay);
    if (value !== undefined) {
      void helpers.setFieldValue('spec.sshPublicKey', value);
    }
  }

  if (pullSecretOverlay.defaultValue !== undefined) {
    const value = overlayDefaultToFormValue(pullSecretOverlay);
    if (value !== undefined) {
      void helpers.setFieldValue('spec.pullSecret', value);
    }
  }
};
