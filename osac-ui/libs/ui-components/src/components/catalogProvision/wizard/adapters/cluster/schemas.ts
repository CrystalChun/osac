import type { TFunction } from 'i18next';
import * as yup from 'yup';

import type { ClusterCatalogItem } from '@osac/types';

import { ipv4CidrsOverlap, isValidCidr } from './cidr';
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

  const nodeSetEntrySchema = yup.object({
    hostType: labeledResourceRefSchema(t('Host type is required')),
    size: yup
      .string()
      .required(t('Pool size is required'))
      .test('pool-size-positive', t('Pool size must be greater than zero'), (value) => {
        const parsed = Number(value?.trim());
        return Number.isFinite(parsed) && parsed > 0;
      }),
  });

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
    specNodeSets: yup.object().test('node-sets', '', function (value) {
      const nodeSets = (value ?? {}) as Record<
        string,
        { hostType?: { value?: string; label?: string }; size?: string }
      >;
      const root = this.from?.[this.from.length - 1]?.value as
        | { templateState?: { poolNames?: string[] } }
        | undefined;
      const expectedPools = root?.templateState?.poolNames ?? [];
      const poolNames = Object.keys(nodeSets);
      if (expectedPools.length > 0 && poolNames.length === 0) {
        return this.createError({
          message: t('Worker pools are required'),
          path: `${this.path}`,
        });
      }
      if (poolNames.length === 0) {
        return true;
      }
      const errors: yup.ValidationError[] = [];
      for (const poolName of poolNames) {
        try {
          nodeSetEntrySchema.validateSync(nodeSets[poolName], { abortEarly: false });
        } catch (error) {
          if (error instanceof yup.ValidationError) {
            for (const inner of error.inner.length > 0 ? error.inner : [error]) {
              if (!inner.path) {
                continue;
              }
              errors.push(
                new yup.ValidationError(
                  inner.message,
                  inner.value,
                  `spec.nodeSets.${poolName}.${inner.path}`,
                ),
              );
            }
          }
        }
      }
      if (errors.length === 0) {
        return true;
      }
      return new yup.ValidationError(errors, value, this.path);
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
    case 'configuration': {
      const templateId = catalogItem?.template?.trim() ?? '';
      return yup.object({
        templateState: yup
          .object({
            resolved: yup.boolean().required(),
            poolNames: yup.array().of(yup.string().required()).required(),
          })
          .test('template-ready', function (templateState) {
            if (!templateId) {
              return true;
            }
            if (!templateState?.resolved) {
              return this.createError({
                message: t('Wait for the cluster template to load before continuing.'),
              });
            }
            return true;
          }),
        spec: yup.object({
          releaseImage: fields.specReleaseImage,
          nodeSets: fields.specNodeSets,
        }),
      });
    }
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
