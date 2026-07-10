import type { BareMetalInstanceCatalogItem } from '@osac/types';

import { BM_SSH_KEY_FORM_PATH, BM_SSH_KEY_WIRE_PATH } from './fields';
import OsacForm from '../../../../Form/OsacForm';
import NameField from '../../fields/NameField';
import SshKeyField from '../../fields/SshKeyField';

interface BareMetalGeneralStepProps {
  catalogItem: BareMetalInstanceCatalogItem | null;
}

const BareMetalGeneralStep = ({ catalogItem }: BareMetalGeneralStepProps) => (
  <OsacForm>
    <NameField />
    <SshKeyField
      catalogItem={catalogItem}
      wirePath={BM_SSH_KEY_WIRE_PATH}
      name={BM_SSH_KEY_FORM_PATH}
    />
  </OsacForm>
);

export default BareMetalGeneralStep;
