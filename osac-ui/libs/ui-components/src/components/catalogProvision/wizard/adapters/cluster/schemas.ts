import type { TFunction } from 'i18next';
import * as yup from 'yup';

import type { ClusterCatalogItem } from '@osac/types';

import { isValidCidr } from './cidr';
import {
  getCatalogFieldOverlay,
  hasCatalogFieldDefinition,
  mergeCatalogValidation,
  readCatalogFieldDefinitions,
} from '../../catalogOverlay';
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
    t('catalogProvision.cluster.fields.sshKey'),
  );
  const pullSecretOverlay = getCatalogFieldOverlay(
    CLUSTER_PULL_SECRET_WIRE_PATH,
    definitions,
    t('catalogProvision.cluster.fields.pullSecret'),
  );
  const releaseImageOverlay = getCatalogFieldOverlay(
    CLUSTER_RELEASE_IMAGE_WIRE_PATH,
    definitions,
    t('catalogProvision.cluster.fields.releaseImage'),
  );
  const podCidrOverlay = getCatalogFieldOverlay(
    CLUSTER_POD_CIDR_WIRE_PATH,
    definitions,
    t('catalogProvision.cluster.fields.podCidr'),
  );
  const serviceCidrOverlay = getCatalogFieldOverlay(
    CLUSTER_SERVICE_CIDR_WIRE_PATH,
    definitions,
    t('catalogProvision.cluster.fields.serviceCidr'),
  );

  const sshKeyRequired = hasCatalogFieldDefinition(CLUSTER_SSH_KEY_WIRE_PATH, definitions);

  const nodeSetEntrySchema = yup.object({
    hostType: yup.string().required(),
    size: yup
      .string()
      .required(t('catalogProvision.validation.clusterPoolSizeRequired'))
      .test(
        'pool-size-positive',
        t('catalogProvision.validation.clusterPoolSizePositive'),
        (value) => {
          const parsed = Number(value?.trim());
          return Number.isFinite(parsed) && parsed > 0;
        },
      ),
  });

  return {
    catalogItemId: yup.string().required(t('catalogProvision.validation.catalogItemRequired')),
    metadataName: buildMetadataNameSchema(t),
    specSshPublicKey: mergeCatalogValidation(
      yup.string(),
      sshKeyOverlay,
      sshKeyRequired,
      t('catalogProvision.validation.required'),
    ),
    specPullSecret: mergeCatalogValidation(
      yup.string().trim(),
      pullSecretOverlay,
      true,
      t('catalogProvision.validation.clusterPullSecretRequired'),
    ),
    specReleaseImage: mergeCatalogValidation(
      yup.string().trim(),
      releaseImageOverlay,
      true,
      t('catalogProvision.validation.clusterReleaseImageRequired'),
    ),
    specNodeSets: yup.object().test('node-sets', '', (value, context) => {
      const nodeSets = (value ?? {}) as Record<string, { hostType?: string; size?: string }>;
      const poolNames = Object.keys(nodeSets);
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
      return new yup.ValidationError(errors, value, context.path);
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
          nodeSets: fields.specNodeSets,
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
