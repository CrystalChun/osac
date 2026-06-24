import type { CatalogProvisionAdapter } from './types';
import { useClusterCatalogItems } from '../../../../api/v1/cluster-catalog-item';
import {
  type CatalogProvisionCatalogItem,
  clusterCatalogItemToProvisionItem,
} from '../../catalogProvisionItem';
import type { CatalogProvisionWizardState } from '../types';

export const clusterAdapter: CatalogProvisionAdapter<CatalogProvisionCatalogItem, unknown> = {
  kind: 'cluster',
  useCatalogItems: () => {
    const query = useClusterCatalogItems();
    return {
      data: (query.data ?? []).map(clusterCatalogItemToProvisionItem),
      isPending: query.isPending,
      isError: query.isError,
      refetch: () => {
        void query.refetch();
      },
    };
  },
  buildCreatePayload: (
    _draft: CatalogProvisionWizardState,
    _item: CatalogProvisionCatalogItem,
  ): Partial<unknown> => ({}),
  createButtonLabel: 'Create cluster',
  wizardTitle: 'Create cluster',
  wizardDescription: 'Select a catalog item, configure, and provision.',
  resourceNameLabel: 'Cluster name',
  ariaLabel: 'Create cluster wizard',
};
