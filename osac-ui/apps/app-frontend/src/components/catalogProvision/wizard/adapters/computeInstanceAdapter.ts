import type { ComputeInstanceCatalogItem } from '@osac/types';
import { useComputeInstanceCatalogItems } from '@osac/ui-components/api/v1/compute-instance-catalog-item';

import type { CatalogProvisionWizardState } from '../types';
import { buildComputeInstanceFromWizardDraft } from '../wizardBuild';

export const computeInstanceAdapter = {
  kind: 'compute_instance' as const,
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
  buildCreatePayload: (draft: CatalogProvisionWizardState, item: ComputeInstanceCatalogItem) =>
    buildComputeInstanceFromWizardDraft(draft, item),
  createButtonLabel: 'Create virtual machine',
  wizardTitle: 'Create virtual machine',
  wizardDescription: 'Select a catalog item, configure, and provision.',
  resourceNameLabel: 'Virtual machine name',
  ariaLabel: 'Create virtual machine wizard',
};
