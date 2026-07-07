/**
 * Inline wire JSON bodies for cluster mutations — not a response normalization layer.
 */
import { serializeSpecRecordToWire } from './compute-instance-wire';

type JsonRecord = Record<string, unknown>;

const isEmptyWireValue = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string' && !value.trim()) {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  return false;
};

const serializeClusterSpecForCreate = (
  spec: JsonRecord | undefined,
  opts?: { catalogItemOnly?: boolean },
): Record<string, unknown> | undefined => {
  if (!spec) {
    return undefined;
  }

  const wire = serializeSpecRecordToWire(spec);
  if (!wire) {
    return undefined;
  }

  const catalogItem = wire.catalog_item;
  if (opts?.catalogItemOnly && !catalogItem) {
    throw new Error('spec.catalog_item is required for catalog-item create');
  }
  if (opts?.catalogItemOnly) {
    delete wire.template;
    delete wire.template_parameters;
  }

  return Object.keys(wire).length ? wire : undefined;
};

export type BuildClusterCreateBodyInput = {
  id?: string;
  metadata?: { name?: string };
  spec?: JsonRecord;
};

export type BuildClusterCreateBodyOptions = {
  specCatalogItemOnly?: boolean;
};

/** Builds JSON body for `POST …/clusters` (Cluster at root, snake_case fields). */
export const buildClusterCreateBody = (
  cluster: BuildClusterCreateBodyInput,
  opts?: BuildClusterCreateBodyOptions,
): Record<string, unknown> => {
  const wire: JsonRecord = {};
  if (cluster.id) {
    wire.id = cluster.id;
  }
  const name = cluster.metadata?.name?.trim();
  if (name) {
    wire.metadata = { name };
  }
  const spec = serializeClusterSpecForCreate(cluster.spec, {
    catalogItemOnly: opts?.specCatalogItemOnly,
  });
  if (spec) {
    wire.spec = spec;
  }
  return wire;
};

export const isEmptyClusterWireValue = isEmptyWireValue;
