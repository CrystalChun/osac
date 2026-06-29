import type { TFunction } from 'i18next';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import type { GeneralFieldDescriptor } from '../types';

const VM_SSH_KEY_WIRE_PATH = 'ssh_key';
const VM_SSH_KEY_FORM_PATH = 'spec.sshKey';

export const buildVmGeneralFields = (
  catalogItem: ComputeInstanceCatalogItem | null,
  t: TFunction,
): GeneralFieldDescriptor[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const sshKeyOverlay = getCatalogFieldOverlay(
    VM_SSH_KEY_WIRE_PATH,
    definitions,
    t('catalogProvision.vm.fields.sshKey'),
  );
  const sshKeyRequired = hasCatalogFieldDefinition(VM_SSH_KEY_WIRE_PATH, definitions);

  return [
    {
      name: 'metadata.name',
      labelKey: 'catalogProvision.vm.fields.name',
      isRequired: true,
    },
    {
      name: VM_SSH_KEY_FORM_PATH,
      labelKey: 'catalogProvision.vm.fields.sshKey',
      label: sshKeyOverlay.label,
      multiline: true,
      isRequired: sshKeyRequired,
      isDisabled: !sshKeyOverlay.editable,
    },
  ];
};

export const vmSshKeyWirePath = VM_SSH_KEY_WIRE_PATH;
