import type { ComputeInstanceCatalogItem } from '@osac/types';

import { VM_SSH_KEY_FORM_PATH, VM_SSH_KEY_WIRE_PATH } from './fields';
import OsacForm from '../../../../Form/OsacForm';
import NameField from '../../fields/NameField';
import SshKeyField from '../../fields/SshKeyField';

interface VmGeneralStepProps {
  catalogItem: ComputeInstanceCatalogItem | null;
}

const VmGeneralStep = ({ catalogItem }: VmGeneralStepProps) => (
  <OsacForm>
    <NameField />
    <SshKeyField
      catalogItem={catalogItem}
      wirePath={VM_SSH_KEY_WIRE_PATH}
      name={VM_SSH_KEY_FORM_PATH}
    />
  </OsacForm>
);

export default VmGeneralStep;
