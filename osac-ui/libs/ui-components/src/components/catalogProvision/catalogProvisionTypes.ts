import type { BuildClusterCreateBodyInput } from '../../api/v1/cluster-wire';
import type { BuildComputeInstanceCreateBodyInput } from '../../api/v1/compute-instance-wire';
import type { ClusterWizardValues } from './wizard/adapters/cluster/fields';
import type { ComputeInstanceWizardValues } from './wizard/adapters/computeInstance/fields';

export type CatalogProvisionPayload =
  | BuildComputeInstanceCreateBodyInput
  | BuildClusterCreateBodyInput;

export type CatalogProvisionWizardValues = ComputeInstanceWizardValues | ClusterWizardValues;
