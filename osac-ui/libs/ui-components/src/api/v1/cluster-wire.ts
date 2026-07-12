/**
 * Inline wire JSON bodies for cluster mutations — not a response normalization layer.
 */
import { isEmptyWireValue, serializeSpecRecordToWire } from './compute-instance-wire';

type JsonRecord = Record<string, unknown>;

const serializeClusterSpecForCreate = (
  spec: JsonRecord | undefined,
): Record<string, unknown> | undefined => {
  if (!spec) {
    return undefined;
  }

  const wire = serializeSpecRecordToWire(spec);
  if (!wire) {
    return undefined;
  }

  const catalogItem = wire.catalog_item;
  if (!catalogItem) {
    throw new Error('spec.catalog_item is required for catalog-item create');
  }

  delete wire.template;
  delete wire.template_parameters;

  return Object.keys(wire).length ? wire : undefined;
};

export type BuildClusterCreateBodyInput = {
  id?: string;
  metadata?: { name?: string };
  spec?: JsonRecord;
};

/** Builds JSON body for `POST …/clusters` (Cluster at root, snake_case fields). */
export const buildClusterCreateBody = (
  cluster: BuildClusterCreateBodyInput,
): Record<string, unknown> => {
  const wire: JsonRecord = {};
  if (cluster.id) {
    wire.id = cluster.id;
  }
  const name = cluster.metadata?.name?.trim();
  if (name) {
    wire.metadata = { name };
  }
  const spec = serializeClusterSpecForCreate(cluster.spec);
  if (spec) {
    wire.spec = spec;
  }
  return wire;
};

export const isEmptyClusterWireValue = isEmptyWireValue;
