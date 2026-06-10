/**
 * Keep provisioning placeholders and newly created VMs at the end of the list.
 */
import { isPendingVmClientId } from './pendingVmCreation';
import type { ComputeInstance } from '@osac/api-contracts/types';

export const pinProvisioningVmsToListEnd = (
  vms: ComputeInstance[],
  postCreateWatchIds: readonly string[],
): ComputeInstance[] => {
  if (vms.length === 0) {
    return vms;
  }

  const watchSet = new Set(postCreateWatchIds);
  const main: ComputeInstance[] = [];
  const tail: ComputeInstance[] = [];

  for (const vm of vms) {
    if (isPendingVmClientId(vm.id) || watchSet.has(vm.id)) {
      tail.push(vm);
    } else {
      main.push(vm);
    }
  }

  if (tail.length === 0) {
    return vms;
  }
  return [...main, ...tail];
};
