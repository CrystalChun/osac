import type { CatalogProvisionAdapter } from './types';
import type { CatalogProvisionCatalogItem } from '../../catalogProvisionItem';

/** Placeholder until cluster catalog items API and provisioning are wired. */
export const clusterAdapter: CatalogProvisionAdapter<CatalogProvisionCatalogItem, unknown> = {
  kind: 'cluster',
  useCatalogItems: () => ({
    data: [],
    isPending: false,
    isError: false,
    refetch: () => undefined,
  }),
  buildCreatePayload: () => ({}),
  createButtonLabel: 'Create cluster',
  wizardTitle: 'Create cluster',
  wizardDescription: 'Select a catalog item, configure, and provision.',
  resourceNameLabel: 'Cluster name',
  ariaLabel: 'Create cluster wizard',
};
