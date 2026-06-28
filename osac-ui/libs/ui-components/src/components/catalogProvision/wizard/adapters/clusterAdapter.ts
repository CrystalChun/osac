import type { CatalogProvisionAdapter } from './types';
import { useClusterCatalogItems } from '../../../../api/v1/cluster-catalog-item';
import {
  type CatalogProvisionCatalogItem,
  clusterCatalogItemToProvisionItem,
} from '../../catalogProvisionItem';
import type { ComputeInstanceWizardValues } from './computeInstance/fields';
import { createEmptyComputeInstanceValues } from './computeInstance/payload';

/** Placeholder until cluster catalog provisioning is implemented. */
export const clusterAdapter: CatalogProvisionAdapter<
  CatalogProvisionCatalogItem,
  ComputeInstanceWizardValues,
  Record<string, never>
> = {
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
  getInitialValues: () => createEmptyComputeInstanceValues(),
  buildCreatePayload: () => ({}),
  ConfigurationStep: () => null,
  NetworkingStep: () => null,
  resolveGeneralFields: () => [],
  getWizardSchema: () => undefined,
  getStepFieldPaths: () => [],
  getReviewSections: () => [],
  wizardTitleKey: 'catalogProvision.cluster.wizardTitle',
  wizardDescriptionKey: 'catalogProvision.cluster.wizardDescription',
  breadcrumbCreateLabelKey: 'catalogProvision.cluster.breadcrumbCreate',
  ariaLabelKey: 'catalogProvision.cluster.ariaLabel',
};
