import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { ClusterCatalogItem } from '@osac/types';

import {
  type ReviewSection,
  formatReviewScalar,
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
  reviewRow,
} from '../catalogOverlay';
import { applyClusterCatalogConfigurationDefaults } from './cluster/applyCatalogDefaults';
import { applyClusterCatalogGeneralDefaults } from './cluster/applyCatalogGeneralDefaults';
import { applyClusterCatalogNetworkingDefaults } from './cluster/applyCatalogNetworkingDefaults';
import { ClusterConfigurationStep } from './cluster/ClusterConfigurationStep';
import { ClusterNetworkingStep } from './cluster/ClusterNetworkingStep';
import type { ClusterWizardValues } from './cluster/fields';
import { buildClusterGeneralFields } from './cluster/generalFields';
import { buildClusterCreatePayload, createEmptyClusterValues } from './cluster/payload';
import { buildClusterStepSchema } from './cluster/schemas';
import type { CatalogProvisionAdapter } from './types';
import { useClusterCatalogItems } from '../../../../api/v1/cluster-catalog-item';
import type { BuildClusterCreateBodyInput } from '../../../../api/v1/cluster-wire';
import { useTranslation } from '../../../../hooks/useTranslation';

export { buildClusterCreatePayload, createEmptyClusterValues } from './cluster/payload';

const formatNodeSetsForReview = (nodeSets: ClusterWizardValues['spec']['nodeSets']): string => {
  const entries = Object.entries(nodeSets);
  if (entries.length === 0) {
    return '—';
  }
  return entries
    .map(([poolName, pool]) => `${poolName}: ${pool.size} × ${pool.hostType}`)
    .join(', ');
};

const buildReviewSections = (
  values: ClusterWizardValues,
  catalogItem: ClusterCatalogItem,
  t: TFunction,
): ReviewSection[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const sshKeyOverlay = getCatalogFieldOverlay(
    'ssh_public_key',
    definitions,
    t('catalogProvision.cluster.fields.sshKey'),
  );
  const pullSecretOverlay = getCatalogFieldOverlay(
    'pull_secret',
    definitions,
    t('catalogProvision.cluster.fields.pullSecret'),
  );
  const releaseImageOverlay = getCatalogFieldOverlay(
    'release_image',
    definitions,
    t('catalogProvision.cluster.fields.releaseImage'),
  );
  const podCidrOverlay = getCatalogFieldOverlay(
    'network.pod_cidr',
    definitions,
    t('catalogProvision.cluster.fields.podCidr'),
  );
  const serviceCidrOverlay = getCatalogFieldOverlay(
    'network.service_cidr',
    definitions,
    t('catalogProvision.cluster.fields.serviceCidr'),
  );

  return [
    {
      title: t('catalogProvision.steps.general.title'),
      rows: [
        reviewRow(
          t('catalogProvision.cluster.fields.name'),
          formatReviewScalar(values.metadata.name),
        ),
        reviewRow(sshKeyOverlay.label, formatReviewScalar(values.spec.sshPublicKey, true)),
        reviewRow(pullSecretOverlay.label, formatReviewScalar(values.spec.pullSecret, true)),
      ],
    },
    {
      title: t('catalogProvision.steps.configuration.title'),
      rows: [
        reviewRow(releaseImageOverlay.label, formatReviewScalar(values.spec.releaseImage)),
        reviewRow(
          t('catalogProvision.cluster.fields.nodeSets'),
          formatNodeSetsForReview(values.spec.nodeSets),
        ),
      ],
    },
    {
      title: t('catalogProvision.steps.networking.title'),
      rows: [
        reviewRow(podCidrOverlay.label, formatReviewScalar(values.spec.network.podCidr)),
        reviewRow(serviceCidrOverlay.label, formatReviewScalar(values.spec.network.serviceCidr)),
      ],
    },
  ];
};

export const useClusterAdapter = (): CatalogProvisionAdapter<
  ClusterCatalogItem,
  ClusterWizardValues,
  BuildClusterCreateBodyInput
> => {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      kind: 'cluster' as const,
      useCatalogItems: () => {
        const query = useClusterCatalogItems();
        return {
          data: query.data ?? [],
          isPending: query.isPending,
          isError: query.isError,
          refetch: () => {
            void query.refetch();
          },
        };
      },
      getInitialValues: () => createEmptyClusterValues(),
      buildCreatePayload: buildClusterCreatePayload,
      ConfigurationStep: ClusterConfigurationStep,
      NetworkingStep: ClusterNetworkingStep,
      resolveGeneralFields: (catalogItem) => buildClusterGeneralFields(catalogItem, t),
      getStepValidationSchema: (catalogItem, stepId) =>
        buildClusterStepSchema(catalogItem, stepId, t),
      getReviewSections: (values, catalogItem) => buildReviewSections(values, catalogItem, t),
      onCatalogItemSelected: (item, helpers) => {
        helpers.resetForm({
          values: {
            ...createEmptyClusterValues(),
            catalogItemId: item.id,
          },
        });
        applyClusterCatalogConfigurationDefaults(item, helpers, t);
        applyClusterCatalogGeneralDefaults(item, helpers, t);
        applyClusterCatalogNetworkingDefaults(item, helpers, t);
      },
      wizardTitleKey: 'catalogProvision.cluster.wizardTitle',
      wizardDescriptionKey: 'catalogProvision.cluster.wizardDescription',
      breadcrumbCreateLabelKey: 'catalogProvision.cluster.breadcrumbCreate',
      ariaLabelKey: 'catalogProvision.cluster.ariaLabel',
    }),
    [t],
  );
};
