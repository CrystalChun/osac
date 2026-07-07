import type { TFunction } from 'i18next';

import type { ClusterCatalogItem } from '@osac/types';

import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import type { GeneralFieldDescriptor } from '../types';

const CLUSTER_SSH_KEY_WIRE_PATH = 'ssh_public_key';
const CLUSTER_SSH_KEY_FORM_PATH = 'spec.sshPublicKey';
const CLUSTER_PULL_SECRET_FORM_PATH = 'spec.pullSecret';

export const buildClusterGeneralFields = (
  catalogItem: ClusterCatalogItem | null,
  t: TFunction,
): GeneralFieldDescriptor[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const sshKeyOverlay = getCatalogFieldOverlay(
    CLUSTER_SSH_KEY_WIRE_PATH,
    definitions,
    t('catalogProvision.cluster.fields.sshKey'),
  );
  const pullSecretOverlay = getCatalogFieldOverlay(
    'pull_secret',
    definitions,
    t('catalogProvision.cluster.fields.pullSecret'),
  );
  const sshKeyRequired = hasCatalogFieldDefinition(CLUSTER_SSH_KEY_WIRE_PATH, definitions);

  return [
    {
      name: 'metadata.name',
      labelKey: 'catalogProvision.cluster.fields.name',
      helperTextKey: 'catalogProvision.fields.nameDescription',
      isRequired: true,
    },
    {
      name: CLUSTER_SSH_KEY_FORM_PATH,
      labelKey: 'catalogProvision.cluster.fields.sshKey',
      label: sshKeyOverlay.label,
      multiline: true,
      isRequired: sshKeyRequired,
      isDisabled: !sshKeyOverlay.editable,
    },
    {
      name: CLUSTER_PULL_SECRET_FORM_PATH,
      labelKey: 'catalogProvision.cluster.fields.pullSecret',
      label: pullSecretOverlay.label,
      multiline: true,
      isPassword: true,
      isRequired: true,
      isDisabled: !pullSecretOverlay.editable,
    },
  ];
};

export const clusterSshKeyWirePath = CLUSTER_SSH_KEY_WIRE_PATH;
