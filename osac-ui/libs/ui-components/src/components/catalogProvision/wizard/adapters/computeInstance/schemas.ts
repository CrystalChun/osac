import type { TFunction } from 'i18next';
import * as yup from 'yup';

import {
  labeledResourceRefArraySchema,
  labeledResourceRefSchema,
} from '../../../../Form/labeledResourceRefSchema';
import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  mergeCatalogValidation,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import { isValidSshPublicKey } from '../../fields/credentialValidation';
import { buildMetadataNameSchema } from '../../metadataNameSchema';
import type { WizardStepId } from '../../stepIds';

const buildComputeInstanceFieldDefinitions = (catalogItem: unknown, t: TFunction) => {
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
  const sshKeyOverlay = getCatalogFieldOverlay('ssh_key', definitions, t('SSH public key'));
  const sshKeyRequired = hasCatalogFieldDefinition('ssh_key', definitions);
  const userDataRequired = hasCatalogFieldDefinition('spec.user_data', definitions);

  return {
    catalogItemId: yup.string().required(t('catalogProvision.validation.catalogItemRequired')),
    metadataName: buildMetadataNameSchema(t),
    specSshKey: mergeCatalogValidation(
      yup
        .string()
        .test(
          'ssh-public-key',
          t(
            'SSH public key must be in the form "[TYPE] key [[EMAIL]]". Supported types are ssh-rsa, ssh-ed25519, and ecdsa-sha2-nistp256/384/521.',
          ),
          (value) => isValidSshPublicKey(value),
        ),
      sshKeyOverlay,
      sshKeyRequired,
      t('catalogProvision.validation.required'),
    ),
    specImage: yup.object({
      sourceRef: mergeCatalogValidation(
        yup.string().trim(),
        imageOverlay,
        true,
        t('catalogProvision.validation.imageRequired'),
      ),
    }),
    specInstanceType: labeledResourceRefSchema(
      t('catalogProvision.validation.instanceTypeRequired'),
    ),
    specUserData: mergeCatalogValidation(
      yup.string(),
      userDataOverlay,
      userDataRequired,
      t('catalogProvision.validation.required'),
    ),
    specBootDisk: yup.object({
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
    specNetworking: yup.object({
      virtualNetwork: labeledResourceRefSchema(
        t('catalogProvision.validation.virtualNetworkRequired'),
      ),
      subnet: labeledResourceRefSchema(t('catalogProvision.validation.subnetRequired')),
      securityGroups: labeledResourceRefArraySchema(
        t('catalogProvision.validation.securityGroupRequired'),
      ),
    }),
  };
};

/**
 * Builds a Yup schema for one wizard step only.
 *
 * Formik always validates the full form values against `validationSchema`. If this
 * included every step's fields, blur and Next would fail on steps the user has not
 * reached yet (for example, empty networking while still on General). Returning
 * only the active step's fields keeps validation scoped to the current step.
 */
export const buildComputeInstanceStepSchema = (
  catalogItem: unknown,
  stepId: WizardStepId,
  t: TFunction,
): yup.AnyObjectSchema | undefined => {
  // Review has no editable fields; Create provisions without Formik validation.
  if (stepId === 'review') {
    return undefined;
  }

  const fields = buildComputeInstanceFieldDefinitions(catalogItem, t);

  switch (stepId) {
    case 'catalog':
      return yup.object({
        catalogItemId: fields.catalogItemId,
      });
    case 'general':
      return yup.object({
        metadata: yup.object({
          name: fields.metadataName,
        }),
        spec: yup.object({
          sshKey: fields.specSshKey,
        }),
      });
    case 'configuration':
      return yup.object({
        spec: yup.object({
          image: fields.specImage,
          instanceType: fields.specInstanceType,
          userData: fields.specUserData,
          bootDisk: fields.specBootDisk,
        }),
      });
    case 'networking':
      return yup.object({
        spec: yup.object({
          networking: fields.specNetworking,
        }),
      });
    default:
      return undefined;
  }
};
