import type { TFunction } from 'i18next';
import * as yup from 'yup';

import type { ClusterCatalogItem } from '@osac/types';

import type { ClusterNodeSetRow } from './fields';
import {
  CLUSTER_POD_CIDR_WIRE_PATH,
  CLUSTER_PULL_SECRET_WIRE_PATH,
  CLUSTER_RELEASE_IMAGE_WIRE_PATH,
  CLUSTER_SERVICE_CIDR_WIRE_PATH,
  CLUSTER_SSH_KEY_WIRE_PATH,
} from './fields';
import {
  buildCidrSchema,
  cidrsOverlap,
  isValidCidr,
} from '../../../../../validation/cidr-validation';
import { labeledResourceRefSchema } from '../../../../Form/labeledResourceRefSchema';
import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  mergeCatalogValidation,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
import { isValidPullSecret, isValidSshPublicKey } from '../../fields/credentialValidation';
import { buildMetadataNameSchema } from '../../metadataNameSchema';
import type { WizardStepId } from '../../stepIds';

const nodeSetRowSchema = (t: TFunction) =>
  yup.object({
    rowId: yup.string().required(),
    hostType: labeledResourceRefSchema(t('Host type is required')),
    size: yup
      .string()
      .required(t('Pool size is required'))
      .test('pool-size-positive', t('Pool size must be greater than zero'), (value) => {
        const parsed = Number(value?.trim());
        return Number.isFinite(parsed) && parsed > 0;
      }),
  });

const buildClusterFieldDefinitions = (catalogItem: unknown, t: TFunction) => {
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

  const sshKeyRequired = hasCatalogFieldDefinition(CLUSTER_SSH_KEY_WIRE_PATH, definitions);
  const rowSchema = nodeSetRowSchema(t);

  return {
    catalogItemId: yup.string().required(t('Select a catalog item')),
    metadataName: buildMetadataNameSchema(t),
    specSshPublicKey: mergeCatalogValidation(
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
      t('This field is required'),
    ),
    specPullSecret: mergeCatalogValidation(
      yup
        .string()
        .trim()
        .test(
          'pull-secret',
          t(
            'Invalid pull secret format. Paste the complete JSON from your Red Hat account pull secret.',
          ),
          (value) => isValidPullSecret(value),
        ),
      pullSecretOverlay,
      true,
      t('Pull secret is required'),
    ),
    specReleaseImage: mergeCatalogValidation(
      yup.string().trim(),
      releaseImageOverlay,
      true,
      t('Release image is required'),
    ),
    specNodeSetRows: yup
      .array()
      .of(rowSchema)
      .min(1, t('At least one node set is required'))
      .test('unique-host-types', t('Each host type can only be selected once'), (rows) => {
        const hostTypeIds = (rows ?? [])
          .map((row) => row?.hostType?.value?.trim() ?? '')
          .filter(Boolean);
        return new Set(hostTypeIds).size === hostTypeIds.length;
      }),
    specNetwork: yup.object({
      podCidr: mergeCatalogValidation(
        buildCidrSchema(t, 'ipv4'),
        podCidrOverlay,
        false,
        t('This field is required'),
      ),
      serviceCidr: mergeCatalogValidation(
        buildCidrSchema(t, 'ipv4').test(
          'service-cidr-no-overlap',
          t('Service CIDR must not overlap the pod CIDR.'),
          function (value) {
            const parent = this.parent as { podCidr?: string } | undefined;
            const podCidr = parent?.podCidr ?? '';
            if (!value?.trim() || !podCidr.trim()) {
              return true;
            }
            if (!isValidCidr(value, 'ipv4') || !isValidCidr(podCidr, 'ipv4')) {
              return true;
            }
            return !cidrsOverlap(podCidr, value, 'ipv4');
          },
        ),
        serviceCidrOverlay,
        false,
        t('This field is required'),
      ),
    }),
  };
};

export const buildClusterStepSchema = (
  catalogItem: ClusterCatalogItem | null,
  stepId: WizardStepId,
  t: TFunction,
): yup.AnyObjectSchema | undefined => {
  if (stepId === 'review') {
    return undefined;
  }

  const fields = buildClusterFieldDefinitions(catalogItem, t);

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
          sshPublicKey: fields.specSshPublicKey,
          pullSecret: fields.specPullSecret,
        }),
      });
    case 'configuration':
      return yup.object({
        spec: yup.object({
          releaseImage: fields.specReleaseImage,
          nodeSetRows: fields.specNodeSetRows,
        }),
      });
    case 'networking':
      return yup.object({
        spec: yup.object({
          network: fields.specNetwork,
        }),
      });
    default:
      return undefined;
  }
};

export type { ClusterNodeSetRow };
