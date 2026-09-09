import { useMemo } from 'react';

import type { ComputeInstance } from '@osac/types';

import { useInstanceType } from '../../../api/v1/instance-types';
import {
  formatResourceIdForReview,
  formatResourceIdsForReview,
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
} from '../../../api/v1/networking';

export type VmNetworkingRow = {
  virtualNetwork: string;
  subnet: string;
  securityGroups: string;
};

export const useVmDetailsDisplay = (vm: ComputeInstance) => {
  const catalogItemName = vm.spec?.catalogItem?.name?.trim() ?? '';
  const instanceTypeId = vm.spec?.instanceType?.id;

  const { data: instanceType, isLoading: isInstanceTypeLoading } = useInstanceType(instanceTypeId);
  const { data: virtualNetworks = [] } = useVirtualNetworks();
  const { data: subnets = [] } = useSubnets();
  const { data: securityGroups = [] } = useSecurityGroups();

  const networkingRows = useMemo((): VmNetworkingRow[] => {
    const attachments = vm.spec?.networkAttachments ?? [];
    return attachments.map((attachment) => {
      const subnet = subnets.find((item) => item.id === attachment.subnet?.id);
      const virtualNetworkId = subnet?.spec?.virtualNetwork?.id ?? '';
      return {
        virtualNetwork: formatResourceIdForReview(virtualNetworkId, virtualNetworks),
        subnet: formatResourceIdForReview(attachment.subnet?.id ?? '', subnets),
        securityGroups: formatResourceIdsForReview(
          attachment.securityGroups?.map(({ id }) => id) ?? [],
          securityGroups,
        ),
      };
    });
  }, [vm.spec?.networkAttachments, subnets, virtualNetworks, securityGroups]);

  return {
    catalogItemName,
    instanceType,
    instanceTypeId,
    isInstanceTypeLoading,
    networkingRows,
    hasCatalogItem: Boolean(catalogItemName || vm.spec?.catalogItem?.id?.trim()),
  };
};
