import { useMemo } from 'react';

import type { ComputeInstance } from '@osac/types';

import { useComputeInstanceCatalogItem } from '../../../api/v1/compute-instance-catalog-item';
import { useInstanceType } from '../../../api/v1/instance-types';
import {
  formatResourceIdForReview,
  formatResourceIdsForReview,
  useSecurityGroups,
  useSubnets,
  useVirtualNetworks,
} from '../../../api/v1/networking';
import { useTranslation } from '../../../hooks/useTranslation';
import {
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
} from '../../catalogProvision/wizard/catalogOverlay';

export type VmNetworkingRow = {
  virtualNetwork: string;
  subnet: string;
  securityGroups: string;
};

export const useVmDetailsDisplay = (vm: ComputeInstance) => {
  const { t } = useTranslation();
  const catalogItemId = vm.spec?.catalogItem?.id;
  const instanceTypeId = vm.spec?.instanceType?.id;

  const { data: catalogItem, isLoading: isCatalogItemLoading } =
    useComputeInstanceCatalogItem(catalogItemId);
  const { data: instanceType, isLoading: isInstanceTypeLoading } = useInstanceType(instanceTypeId);
  const { data: virtualNetworks = [] } = useVirtualNetworks();
  const { data: subnets = [] } = useSubnets();
  const { data: securityGroups = [] } = useSecurityGroups();

  const fieldLabels = useMemo(() => {
    const definitions = catalogItem ? readCatalogFieldDefinitions(catalogItem) : [];
    const imageOverlay = getCatalogFieldOverlay(
      'spec.image.source_ref',
      definitions,
      t('catalogProvision.vm.fields.image'),
    );
    const userDataOverlay = getCatalogFieldOverlay(
      'spec.user_data',
      definitions,
      t('catalogProvision.vm.fields.userData'),
    );
    const bootDiskOverlay = getCatalogFieldOverlay(
      'spec.boot_disk.size_gib',
      definitions,
      t('catalogProvision.vm.fields.bootDisk'),
    );
    const sshKeyOverlay = getCatalogFieldOverlay(
      'ssh_public_key',
      definitions,
      t('catalogProvision.vm.fields.sshKey'),
    );

    return {
      image: imageOverlay.label,
      userData: userDataOverlay.label,
      bootDisk: bootDiskOverlay.label,
      sshPublicKey: sshKeyOverlay.label,
    };
  }, [catalogItem, t]);

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
    catalogItem,
    catalogItemId,
    isCatalogItemLoading,
    instanceType,
    instanceTypeId,
    isInstanceTypeLoading,
    fieldLabels,
    networkingRows,
    hasCatalogItem: Boolean(catalogItemId?.trim()),
  };
};
