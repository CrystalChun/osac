import type { ClusterCatalogItem } from '@osac/types';

import { CLUSTER_SSH_KEY_FORM_PATH, CLUSTER_SSH_KEY_WIRE_PATH } from './fields';
import OsacForm from '../../../../Form/OsacForm';
import NameField from '../../fields/NameField';
import PullSecretField from '../../fields/PullSecretField';
import SshKeyField from '../../fields/SshKeyField';

interface ClusterGeneralStepProps {
  catalogItem: ClusterCatalogItem | null;
}

const ClusterGeneralStep = ({ catalogItem }: ClusterGeneralStepProps) => (
  <OsacForm>
    <NameField />
    <SshKeyField
      catalogItem={catalogItem}
      wirePath={CLUSTER_SSH_KEY_WIRE_PATH}
      name={CLUSTER_SSH_KEY_FORM_PATH}
    />
    <PullSecretField catalogItem={catalogItem} />
  </OsacForm>
);

export default ClusterGeneralStep;
