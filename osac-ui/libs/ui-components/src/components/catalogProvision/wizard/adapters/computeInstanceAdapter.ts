import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import { applyVmCatalogConfigurationDefaults } from './computeInstance/applyCatalogDefaults';
import { applyVmCatalogGeneralDefaults } from './computeInstance/applyCatalogGeneralDefaults';
import type { ComputeInstanceWizardValues } from './computeInstance/fields';
import { WIZARD_STEP_FIELD_PATHS } from './computeInstance/fields';
import { buildVmGeneralFields } from './computeInstance/generalFields';
import { buildComputeInstanceCreatePayload, createEmptyComputeInstanceValues } from './computeInstance/payload';
import { buildComputeInstanceWizardSchema } from './computeInstance/schemas';
import { VmConfigurationStep } from './computeInstance/VmConfigurationStep';
import { VmNetworkingStep } from './computeInstance/VmNetworkingStep';
import { useComputeInstanceCatalogItems } from '../../../../api/v1/compute-instance-catalog-item';
import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { formatResourceIdForReview, formatResourceIdsForReview } from '../../../../api/v1/networking';
import { formatInstanceTypeReviewLabel } from '../../../../api/v1/instance-types';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  type ReviewSection,
  formatReviewScalar,
  formatBootDiskSizeForReview,
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
  reviewRow,
} from '../catalogOverlay';
import type { CatalogProvisionAdapter, ReviewContext } from './types';

export { buildComputeInstanceCreatePayload, createEmptyComputeInstanceValues } from './computeInstance/payload';

const buildReviewSections = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
  t: TFunction,
  context: ReviewContext = {},
): ReviewSection[] => {
  const definitions = readCatalogFieldDefinitions(catalogItem);
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
    'ssh_key',
    definitions,
    t('catalogProvision.vm.fields.sshKey'),
  );

  return [
    {
      title: t('catalogProvision.steps.general.title'),
      rows: [
        reviewRow(t('catalogProvision.vm.fields.name'), formatReviewScalar(values.metadata.name)),
        reviewRow(
          sshKeyOverlay.label,
          formatReviewScalar(values.spec.sshKey, true),
        ),
      ],
    },
    {
      title: t('catalogProvision.steps.configuration.title'),
      rows: [
        reviewRow(imageOverlay.label, formatReviewScalar(values.spec.image.sourceRef)),
        reviewRow(
          t('catalogProvision.vm.fields.instanceType'),
          formatInstanceTypeReviewLabel(
            values.spec.instanceType,
            context.instanceTypes ?? [],
            t('catalogProvision.instanceTypes.deprecatedSuffix'),
          ),
        ),
        reviewRow(bootDiskOverlay.label, formatBootDiskSizeForReview(values.spec.bootDisk.sizeGib)),
        reviewRow(userDataOverlay.label, formatReviewScalar(values.spec.userData, true)),
      ],
    },
    {
      title: t('catalogProvision.steps.networking.title'),
      rows: [
        reviewRow(
          t('catalogProvision.vm.fields.virtualNetwork'),
          formatResourceIdForReview(
            values.spec.networking.virtualNetworkId,
            context.virtualNetworks ?? [],
          ),
        ),
        reviewRow(
          t('catalogProvision.vm.fields.subnet'),
          formatResourceIdForReview(values.spec.networking.subnetId, context.subnets ?? []),
        ),
        reviewRow(
          t('catalogProvision.vm.fields.securityGroup'),
          formatResourceIdsForReview(
            values.spec.networking.securityGroupIds,
            context.securityGroups ?? [],
          ),
        ),
      ],
    },
  ];
};

export const useComputeInstanceAdapter = (): CatalogProvisionAdapter<
  ComputeInstanceCatalogItem,
  ComputeInstanceWizardValues,
  BuildComputeInstanceCreateBodyInput
> => {
  const { t } = useTranslation();

  return useMemo(
    () => ({
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
      getInitialValues: (_catalogItem) => createEmptyComputeInstanceValues(),
      buildCreatePayload: buildComputeInstanceCreatePayload,
      ConfigurationStep: VmConfigurationStep,
      NetworkingStep: VmNetworkingStep,
      resolveGeneralFields: (catalogItem) => buildVmGeneralFields(catalogItem, t),
      getWizardSchema: (catalogItem) => buildComputeInstanceWizardSchema(catalogItem, t),
      getStepFieldPaths: (stepId) => WIZARD_STEP_FIELD_PATHS[stepId] ?? [],
      getReviewSections: (values, catalogItem, context) =>
        buildReviewSections(values, catalogItem, t, context),
      onCatalogItemSelected: (item, helpers) => {
        helpers.resetForm({
          values: {
            ...createEmptyComputeInstanceValues(),
            catalogItemId: item.id,
          },
        });
        applyVmCatalogConfigurationDefaults(item, helpers, t);
        applyVmCatalogGeneralDefaults(item, helpers, t);
      },
      wizardTitleKey: 'catalogProvision.vm.wizardTitle',
      wizardDescriptionKey: 'catalogProvision.vm.wizardDescription',
      breadcrumbCreateLabelKey: 'catalogProvision.vm.breadcrumbCreate',
      ariaLabelKey: 'catalogProvision.vm.ariaLabel',
    }),
    [t],
  );
};
