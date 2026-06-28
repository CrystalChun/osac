import type { TFunction } from 'i18next';
import * as yup from 'yup';

import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  mergeCatalogValidation,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';

export const buildComputeInstanceWizardSchema = (
  catalogItem: unknown,
  t: TFunction,
): yup.AnyObjectSchema => {
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
  const sshKeyRequired = hasCatalogFieldDefinition('ssh_key', definitions);
  const userDataRequired = hasCatalogFieldDefinition('spec.user_data', definitions);

  return yup.object({
    catalogItemId: yup.string().required(t('catalogProvision.validation.catalogItemRequired')),
    metadata: yup.object({
      name: yup.string().trim().required(t('catalogProvision.validation.nameRequired')),
    }),
    spec: yup.object({
      sshKey: mergeCatalogValidation(
        yup.string(),
        sshKeyOverlay,
        sshKeyRequired,
        t('catalogProvision.validation.required'),
      ),
      image: yup.object({
        sourceRef: mergeCatalogValidation(
          yup.string().trim(),
          imageOverlay,
          true,
          t('catalogProvision.validation.imageRequired'),
        ),
      }),
      instanceType: yup
        .string()
        .trim()
        .required(t('catalogProvision.validation.instanceTypeRequired')),
      userData: mergeCatalogValidation(
        yup.string(),
        userDataOverlay,
        userDataRequired,
        t('catalogProvision.validation.required'),
      ),
      bootDisk: yup.object({
        sizeGib: mergeCatalogValidation(
          yup
            .string()
            .test(
              'boot-disk-number',
              t('catalogProvision.validation.bootDiskNumber'),
              (value) => !value?.trim() || !Number.isNaN(Number(value)),
            ),
          bootDiskOverlay,
          true,
          t('catalogProvision.validation.required'),
        ),
      }),
      networking: yup.object({
        virtualNetworkId: yup
          .string()
          .required(t('catalogProvision.validation.virtualNetworkRequired')),
        subnetId: yup.string().required(t('catalogProvision.validation.subnetRequired')),
        securityGroupIds: yup
          .array()
          .of(yup.string().defined())
          .min(1, t('catalogProvision.validation.securityGroupRequired')),
      }),
    }),
  });
};
