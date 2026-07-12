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
import ClusterConfigurationStep from './cluster/ClusterConfigurationStep';
import ClusterGeneralStep from './cluster/ClusterGeneralStep';
import { ClusterNetworkingStep } from './cluster/ClusterNetworkingStep';
import type { ClusterWizardValues } from './cluster/fields';
import {
  CLUSTER_POD_CIDR_WIRE_PATH,
  CLUSTER_PULL_SECRET_WIRE_PATH,
  CLUSTER_RELEASE_IMAGE_WIRE_PATH,
  CLUSTER_SERVICE_CIDR_WIRE_PATH,
  CLUSTER_SSH_KEY_WIRE_PATH,
} from './cluster/fields';
import { buildClusterCreatePayload, createEmptyClusterValues } from './cluster/payload';
import { buildClusterStepSchema } from './cluster/schemas';
import type { CatalogProvisionAdapter } from './types';
import { useClusterCatalogItems } from '../../../../api/v1/cluster-catalog-item';
import type { BuildClusterCreateBodyInput } from '../../../../api/v1/cluster-wire';
import { useTranslation } from '../../../../hooks/useTranslation';
import { formatLabeledResourceRefForReview } from '../../../Form/labeledResourceRef';

export { buildClusterCreatePayload, createEmptyClusterValues } from './cluster/payload';

const formatNodeSetsForReview = (
  nodeSetRows: ClusterWizardValues['spec']['nodeSetRows'],
): string => {
  if (nodeSetRows.length === 0) {
    return '—';
  }
  return nodeSetRows
    .map((row) => `${formatLabeledResourceRefForReview(row.hostType)}: ${row.size}`)
    .join(', ');
};

const buildReviewSections = (
  values: ClusterWizardValues,
  catalogItem: ClusterCatalogItem,
  t: TFunction,
): ReviewSection[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
  const sshKeyOverlay = getCatalogFieldOverlay(
    CLUSTER_SSH_KEY_WIRE_PATH,
    definitions,
    t('SSH public key'),
  );
  const pullSecretOverlay = getCatalogFieldOverlay(
    CLUSTER_PULL_SECRET_WIRE_PATH,
    definitions,
    t('Pull secret'),
  );
  const releaseImageOverlay = getCatalogFieldOverlay(
    CLUSTER_RELEASE_IMAGE_WIRE_PATH,
    definitions,
    t('Release image'),
  );
  const podCidrOverlay = getCatalogFieldOverlay(
    CLUSTER_POD_CIDR_WIRE_PATH,
    definitions,
    t('Pod CIDR'),
  );
  const serviceCidrOverlay = getCatalogFieldOverlay(
    CLUSTER_SERVICE_CIDR_WIRE_PATH,
    definitions,
    t('Service CIDR'),
  );

  return [
    {
      title: t('catalogProvision.steps.general.title'),
      rows: [
        reviewRow(t('Name'), formatReviewScalar(values.metadata.name)),
        reviewRow(sshKeyOverlay.label, formatReviewScalar(values.spec.sshPublicKey, true)),
        reviewRow(pullSecretOverlay.label, formatReviewScalar(values.spec.pullSecret, true)),
      ],
    },
    {
      title: t('catalogProvision.steps.configuration.title'),
      rows: [
        reviewRow(releaseImageOverlay.label, formatReviewScalar(values.spec.releaseImage)),
        reviewRow(t('Node sets'), formatNodeSetsForReview(values.spec.nodeSetRows)),
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
      GeneralStep: ClusterGeneralStep,
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
      wizardTitleKey: t('Create cluster'),
      wizardDescriptionKey: t(
        'Select a catalog item, configure, and provision an OpenShift cluster.',
      ),
      breadcrumbCreateLabelKey: t('Create'),
      ariaLabelKey: t('Create cluster wizard'),
    }),
    [t],
  );
};
