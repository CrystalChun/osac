import type { ComputeInstance, ComputeInstanceCatalogItem } from '@osac/api-contracts/types';
import { useComputeInstanceCatalogItems } from '../../../../api/hooks';
import { buildComputeInstanceFromWizardDraft } from '../wizardBuild';
import type { CatalogProvisionAdapter } from './types';

export const computeInstanceAdapter: CatalogProvisionAdapter<
  ComputeInstanceCatalogItem,
  ComputeInstance
> = {
  kind: 'compute_instance',
  useCatalogItems: () => {
    const query = useComputeInstanceCatalogItems();
    return {
      data: query.data ?? [],
      isPending: query.isPending,
      isError: query.isError,
      refetch: () => {
        void query.refetch();
      },
    };
  },
  buildCreatePayload: buildComputeInstanceFromWizardDraft,
  createButtonLabel: 'Create virtual machine',
  wizardTitle: 'Create virtual machine',
  wizardDescription: 'Select a catalog item, configure, and provision.',
  resourceNameLabel: 'Virtual machine name',
  ariaLabel: 'Create virtual machine wizard',
};
