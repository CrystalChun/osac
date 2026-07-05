import { useMemo } from 'react';
import type { TFunction } from 'i18next';

import type { ComputeInstanceCatalogItem } from '@osac/types';

import {
  type ReviewSection,
  formatBootDiskSizeForReview,
  formatReviewScalar,
  getCatalogFieldOverlay,
  readCatalogFieldDefinitions,
  reviewRow,
} from '../catalogOverlay';
import { applyVmCatalogConfigurationDefaults } from './computeInstance/applyCatalogDefaults';
import { applyVmCatalogGeneralDefaults } from './computeInstance/applyCatalogGeneralDefaults';
import type { ComputeInstanceWizardValues } from './computeInstance/fields';
import { buildVmGeneralFields } from './computeInstance/generalFields';
import {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './computeInstance/payload';
import { buildComputeInstanceStepSchema } from './computeInstance/schemas';
import { VmConfigurationStep } from './computeInstance/VmConfigurationStep';
import { VmNetworkingStep } from './computeInstance/VmNetworkingStep';
import type { CatalogProvisionAdapter } from './types';
import { useComputeInstanceCatalogItems } from '../../../../api/v1/compute-instance-catalog-item';
import type { BuildComputeInstanceCreateBodyInput } from '../../../../api/v1/compute-instance-wire';
import { useTranslation } from '../../../../hooks/useTranslation';
import {
  formatLabeledResourceRefForReview,
  formatLabeledResourceRefsForReview,
} from '../../../Form/labeledResourceRef';

export {
  buildComputeInstanceCreatePayload,
  createEmptyComputeInstanceValues,
} from './computeInstance/payload';

const buildReviewSections = (
  values: ComputeInstanceWizardValues,
  catalogItem: ComputeInstanceCatalogItem,
  t: TFunction,
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
        reviewRow(sshKeyOverlay.label, formatReviewScalar(values.spec.sshKey, true)),
      ],
    },
    {
      title: t('catalogProvision.steps.configuration.title'),
      rows: [
        reviewRow(imageOverlay.label, formatReviewScalar(values.spec.image.sourceRef)),
        reviewRow(
          t('catalogProvision.vm.fields.instanceType'),
          formatLabeledResourceRefForReview(values.spec.instanceType),
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
          formatLabeledResourceRefForReview(values.spec.networking.virtualNetwork),
        ),
        reviewRow(
          t('catalogProvision.vm.fields.subnet'),
          formatLabeledResourceRefForReview(values.spec.networking.subnet),
        ),
        reviewRow(
          t('catalogProvision.vm.fields.securityGroup'),
          formatLabeledResourceRefsForReview(values.spec.networking.securityGroups),
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
      getStepValidationSchema: (catalogItem, stepId) =>
        buildComputeInstanceStepSchema(catalogItem, stepId, t),
      getReviewSections: (values, catalogItem) => buildReviewSections(values, catalogItem, t),
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
