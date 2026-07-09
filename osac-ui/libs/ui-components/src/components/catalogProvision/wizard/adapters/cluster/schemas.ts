import type { TFunction } from 'i18next';
import * as yup from 'yup';

import type { ClusterCatalogItem } from '@osac/types';

import { ipv4CidrsOverlap, isValidCidr } from './cidr';
import type { ClusterNodeSetRow } from './fields';
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

const CLUSTER_SSH_KEY_WIRE_PATH = 'ssh_public_key';
const CLUSTER_PULL_SECRET_WIRE_PATH = 'pull_secret';
const CLUSTER_RELEASE_IMAGE_WIRE_PATH = 'release_image';
const CLUSTER_POD_CIDR_WIRE_PATH = 'network.pod_cidr';
const CLUSTER_SERVICE_CIDR_WIRE_PATH = 'network.service_cidr';

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
    catalogItemId: yup.string().required(t('catalogProvision.validation.catalogItemRequired')),
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
      t('catalogProvision.validation.required'),
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
      t('catalogProvision.validation.clusterReleaseImageRequired'),
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
        yup
          .string()
          .test('pod-cidr', t('catalogProvision.validation.cidrFormat'), (value) =>
            isValidCidr(value ?? ''),
          ),
        podCidrOverlay,
        false,
        t('catalogProvision.validation.required'),
      ),
      serviceCidr: mergeCatalogValidation(
        yup
          .string()
          .test('service-cidr', t('catalogProvision.validation.cidrFormat'), (value) =>
            isValidCidr(value ?? ''),
          )
          .test(
            'service-cidr-no-overlap',
            t('Service CIDR must not overlap the pod CIDR.'),
            function (value) {
              const parent = this.parent as { podCidr?: string } | undefined;
              const podCidr = parent?.podCidr ?? '';
              if (!value?.trim() || !podCidr.trim()) {
                return true;
              }
              if (!isValidCidr(value) || !isValidCidr(podCidr)) {
                return true;
              }
              return !ipv4CidrsOverlap(podCidr, value);
            },
          ),
        serviceCidrOverlay,
        false,
        t('catalogProvision.validation.required'),
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
