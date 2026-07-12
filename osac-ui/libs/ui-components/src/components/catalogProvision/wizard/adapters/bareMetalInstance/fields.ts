import { FormikHelpers } from 'formik';
import { TFunction } from 'i18next';

import { BareMetalInstanceCatalogItem } from '@osac/types';

import {
  getCatalogFieldOverlay,
  overlayDefaultToFormValue,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

export const BM_SSH_KEY_WIRE_PATH = 'spec.ssh_public_key';
export const BM_SSH_KEY_FORM_PATH = 'spec.sshKey';

export const BM_USER_DATA_WIRE_PATH = 'spec.user_data';
export const BM_USER_DATA_FORM_PATH = 'spec.userData';

export interface BareMetalInstanceWizardValues {
  catalogItemId: string;
  metadata: {
    name: string;
  };
  spec: {
    sshKey: string;
    userData: string;
  };
}

export const createEmptyBareMetalInstanceValues = (): BareMetalInstanceWizardValues => ({
  catalogItemId: '',
  metadata: { name: '' },
  spec: {
    sshKey: '',
    userData: '',
  },
});

export const applyBmCatalogDefaults = (
  catalogItem: BareMetalInstanceCatalogItem,
  helpers: FormikHelpers<BareMetalInstanceWizardValues>,
  t: TFunction,
): void => {
  const definitions = readCatalogFieldDefinitions(catalogItem);

  const sshKeyOverlay = getCatalogFieldOverlay(
    BM_SSH_KEY_WIRE_PATH,
    definitions,
    t('SSH public key'),
  );
  const userDataOverlay = getCatalogFieldOverlay(
    BM_USER_DATA_WIRE_PATH,
    definitions,
    t('User data'),
  );

  const sshDefault = overlayDefaultToFormValue(sshKeyOverlay);
  if (sshDefault !== undefined) {
    void helpers.setFieldValue(BM_SSH_KEY_FORM_PATH, sshDefault);
  }

  const userDataDefault = overlayDefaultToFormValue(userDataOverlay);
  if (userDataDefault !== undefined) {
    void helpers.setFieldValue(BM_USER_DATA_FORM_PATH, userDataDefault);
  }
};
