import { describe, expect, it } from 'vitest';
import { ValidationError } from 'yup';

import type { ClusterWizardValues } from './fields';
import { buildClusterStepSchema } from './schemas';
import { clusterCatalogItem } from '../../../test/fixtures';

const t = (key: string) => key;

const emptyValues: ClusterWizardValues = {
  catalogItemId: '',
  templateState: { resolved: true, poolNames: [] },
  metadata: { name: '' },
  spec: {
    sshPublicKey: '',
    pullSecret: '',
    releaseImage: '',
    nodeSets: {},
    network: {
      podCidr: '',
      serviceCidr: '',
    },
  },
};

const validateStep = async (
  stepId: Parameters<typeof buildClusterStepSchema>[1],
  values: ClusterWizardValues,
  catalogItem: unknown = null,
) => {
  const schema = buildClusterStepSchema(catalogItem, stepId, t);
  if (!schema) {
    return {};
  }
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    if (!(error instanceof ValidationError)) {
      throw error;
    }
    const errors: Record<string, unknown> = {};
    for (const inner of error.inner.length > 0 ? error.inner : [error]) {
      if (!inner.path) {
        continue;
      }
      const parts = inner.path.split('.');
      let current: Record<string, unknown> = errors;
      for (let index = 0; index < parts.length - 1; index += 1) {
        const key = parts[index];
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = inner.message;
    }
    return errors;
  }
};

describe('buildClusterStepSchema', () => {
  it('requires catalog item on catalog step', async () => {
    const errors = await validateStep('catalog', emptyValues);
    expect(errors).toEqual({ catalogItemId: 'catalogProvision.validation.catalogItemRequired' });
  });

  it('rejects invalid DNS label names on general step', async () => {
    const errors = await validateStep('general', {
      ...emptyValues,
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'MyCluster' },
      spec: {
        ...emptyValues.spec,
        pullSecret: '{"auths": {}}',
      },
    });
    expect(errors).toEqual({
      metadata: { name: 'catalogProvision.validation.nameDnsLabelCharset' },
    });
  });

  it('rejects malformed pull secret on general step', async () => {
    const errors = await validateStep('general', {
      ...emptyValues,
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster' },
      spec: {
        ...emptyValues.spec,
        pullSecret: '{"foo":"bar"}',
      },
    });
    expect(errors).toEqual({
      spec: {
        pullSecret:
          'Invalid pull secret format. Paste the complete JSON from your Red Hat account pull secret.',
      },
    });
  });

  it('rejects malformed ssh public key on general step', async () => {
    const errors = await validateStep('general', {
      ...emptyValues,
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster' },
      spec: {
        ...emptyValues.spec,
        pullSecret: '{"auths": {}}',
        sshPublicKey: 'not-a-key',
      },
    });
    expect(errors).toEqual({
      spec: {
        sshPublicKey:
          'SSH public key must be in the form "[TYPE] key [[EMAIL]]". Supported types are ssh-rsa, ssh-ed25519, and ecdsa-sha2-nistp256/384/521.',
      },
    });
  });

  it('requires pull secret on general step', async () => {
    const errors = await validateStep('general', {
      ...emptyValues,
      catalogItemId: clusterCatalogItem.id,
      metadata: { name: 'my-cluster' },
    });
    expect(errors).toEqual({
      spec: { pullSecret: 'Pull secret is required' },
    });
  });

  it('requires positive pool sizes on configuration step when pools exist', async () => {
    const errors = await validateStep(
      'configuration',
      {
        ...emptyValues,
        catalogItemId: clusterCatalogItem.id,
        templateState: { resolved: true, poolNames: ['compute'] },
        metadata: { name: 'my-cluster' },
        spec: {
          ...emptyValues.spec,
          pullSecret: '{"auths": {}}',
          releaseImage: '4.17.0',
          nodeSets: {
            compute: { hostType: { value: 'acme_1tb', label: '' }, size: '0' },
          },
        },
      },
      clusterCatalogItem,
    );
    expect(errors).toEqual({
      spec: {
        nodeSets: {
          compute: { size: 'Pool size must be greater than zero' },
        },
      },
    });
  });

  it('does not block configuration step when node sets are empty', async () => {
    const errors = await validateStep(
      'configuration',
      {
        ...emptyValues,
        catalogItemId: clusterCatalogItem.id,
        templateState: { resolved: true, poolNames: [] },
        metadata: { name: 'my-cluster' },
        spec: {
          ...emptyValues.spec,
          pullSecret: '{"auths": {}}',
          releaseImage: '4.17.0',
          nodeSets: {},
        },
      },
      clusterCatalogItem,
    );
    expect(errors).toEqual({});
  });

  it('blocks configuration step while cluster template is loading', async () => {
    const errors = await validateStep(
      'configuration',
      {
        ...emptyValues,
        catalogItemId: clusterCatalogItem.id,
        templateState: { resolved: false, poolNames: [] },
        metadata: { name: 'my-cluster' },
        spec: {
          ...emptyValues.spec,
          pullSecret: '{"auths": {}}',
          releaseImage: '4.17.0',
          nodeSets: {},
        },
      },
      clusterCatalogItem,
    );
    expect(errors).toEqual({
      templateState: 'Wait for the cluster template to load before continuing.',
    });
  });

  it('requires worker pools when template defines node sets', async () => {
    const errors = await validateStep(
      'configuration',
      {
        ...emptyValues,
        catalogItemId: clusterCatalogItem.id,
        templateState: { resolved: true, poolNames: ['compute'] },
        metadata: { name: 'my-cluster' },
        spec: {
          ...emptyValues.spec,
          pullSecret: '{"auths": {}}',
          releaseImage: '4.17.0',
          nodeSets: {},
        },
      },
      clusterCatalogItem,
    );
    expect(errors).toEqual({
      spec: { nodeSets: 'Worker pools are required' },
    });
  });

  it('validates CIDR format on networking step when values are present', async () => {
    const errors = await validateStep(
      'networking',
      {
        ...emptyValues,
        catalogItemId: clusterCatalogItem.id,
        spec: {
          ...emptyValues.spec,
          network: {
            podCidr: 'invalid',
            serviceCidr: '',
          },
        },
      },
      clusterCatalogItem,
    );
    expect(errors).toEqual({
      spec: {
        network: {
          podCidr: 'catalogProvision.validation.cidrFormat',
        },
      },
    });
  });

  it('rejects overlapping pod and service CIDRs on networking step', async () => {
    const errors = await validateStep(
      'networking',
      {
        ...emptyValues,
        catalogItemId: clusterCatalogItem.id,
        spec: {
          ...emptyValues.spec,
          network: {
            podCidr: '10.128.0.0/14',
            serviceCidr: '10.128.0.0/14',
          },
        },
      },
      clusterCatalogItem,
    );
    expect(errors).toEqual({
      spec: {
        network: {
          serviceCidr: 'Service CIDR must not overlap the pod CIDR.',
        },
      },
    });
  });

  it('returns undefined for review step', () => {
    expect(buildClusterStepSchema(clusterCatalogItem, 'review', t)).toBeUndefined();
  });
});
