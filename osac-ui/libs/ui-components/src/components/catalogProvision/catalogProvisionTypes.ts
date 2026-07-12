import { MessageInitShape } from '@bufbuild/protobuf';

import { BareMetalInstanceSchema } from '@osac/types';

import type { BuildClusterCreateBodyInput } from '../../api/v1/cluster-wire';
import type { BuildComputeInstanceCreateBodyInput } from '../../api/v1/compute-instance-wire';
import { BareMetalInstanceWizardValues } from './wizard/adapters/bareMetalInstance/fields';
import type { ClusterWizardValues } from './wizard/adapters/cluster/fields';
import type { ComputeInstanceWizardValues } from './wizard/adapters/computeInstance/fields';

export type CatalogProvisionPayload =
  | BuildComputeInstanceCreateBodyInput
  | BuildClusterCreateBodyInput
  | MessageInitShape<typeof BareMetalInstanceSchema>;

export type CatalogProvisionWizardValues =
  | ComputeInstanceWizardValues
  | ClusterWizardValues
  | BareMetalInstanceWizardValues;
