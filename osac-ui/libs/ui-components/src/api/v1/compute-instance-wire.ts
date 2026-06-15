/**
 * Inline wire JSON bodies for compute instance mutations — not a response normalization layer.
 */
import { COMPUTE_INSTANCE_STATE } from '../../vmDisplayState';

export type ComputeInstancePowerAction = 'start' | 'stop' | 'restart';

type JsonRecord = Record<string, unknown>;

const readStr = (obj: JsonRecord, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
};

const readRecord = (value: unknown): JsonRecord | undefined => {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : undefined;
};

const camelToSnakeKey = (key: string): string =>
  key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

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

/** PATCH body for Start / Stop / Restart on `PATCH …/compute_instances/{id}`. */
export const buildComputeInstancePowerPatchBody = (
  action: ComputeInstancePowerAction,
): Record<string, unknown> => {
  switch (action) {
    case 'stop':
      return {
        spec: { run_strategy: 'Halted' },
        status: { state: COMPUTE_INSTANCE_STATE.STOPPED },
      };
    case 'start':
      return {
        spec: { run_strategy: 'Always' },
        status: { state: COMPUTE_INSTANCE_STATE.RUNNING },
      };
    case 'restart':
      return {
        spec: { restart_requested_at: new Date().toISOString() },
      };
  }
};

const TYPE_INT32 = 'type.googleapis.com/google.protobuf.Int32Value';
const TYPE_INT64 = 'type.googleapis.com/google.protobuf.Int64Value';
const TYPE_DOUBLE = 'type.googleapis.com/google.protobuf.DoubleValue';
const TYPE_BOOL = 'type.googleapis.com/google.protobuf.BoolValue';
const TYPE_STRING = 'type.googleapis.com/google.protobuf.StringValue';

const protoJsonAnyInt32 = (value: number): { '@type': string; value: number } => ({
  '@type': TYPE_INT32,
  value,
});
const protoJsonAnyInt64 = (value: string): { '@type': string; value: string } => ({
  '@type': TYPE_INT64,
  value,
});
const protoJsonAnyDouble = (value: number): { '@type': string; value: number } => ({
  '@type': TYPE_DOUBLE,
  value,
});
const protoJsonAnyBool = (value: boolean): { '@type': string; value: boolean } => ({
  '@type': TYPE_BOOL,
  value,
});
const protoJsonAnyString = (value: string): { '@type': string; value: string } => ({
  '@type': TYPE_STRING,
  value,
});

const wrapTemplateParameterAnyValue = (value: unknown): JsonRecord => {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as JsonRecord;
    if (typeof record['@type'] === 'string') {
      return { ...record };
    }
  }
  if (typeof value === 'boolean') {
    return protoJsonAnyBool(value);
  }
  if (typeof value === 'string') {
    return protoJsonAnyString(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (Number.isInteger(value) && value >= -2147483648 && value <= 2147483647) {
      return protoJsonAnyInt32(value);
    }
    if (Number.isInteger(value)) {
      if (!Number.isSafeInteger(value)) {
        throw new Error('template_parameters int64 must be a safe integer in JavaScript');
      }
      return protoJsonAnyInt64(String(value));
    }
    return protoJsonAnyDouble(value);
  }
  throw new Error(
    `template_parameters values must be ProtoJSON Any-shaped objects or boolean/number/string; got ${typeof value}`,
  );
};

const serializeTemplateParametersWire = (
  templateParameters: JsonRecord | undefined,
): JsonRecord | undefined => {
  if (!templateParameters) {
    return undefined;
  }
  const wire: JsonRecord = {};
  for (const [key, value] of Object.entries(templateParameters)) {
    if (value === undefined || value === null) {
      continue;
    }
    wire[key] = wrapTemplateParameterAnyValue(value);
  }
  return Object.keys(wire).length ? wire : undefined;
};

/** Promote legacy top-level subnet/security_groups to network_attachments when needed. */
const normalizeLegacyNetworkFields = (spec: JsonRecord): JsonRecord => {
  if (spec.network_attachments ?? spec.networkAttachments) {
    return spec;
  }
  const subnet = readStr(spec, 'subnet');
  if (!subnet) {
    return spec;
  }
  const securityGroups = spec.security_groups ?? spec.securityGroups;
  const attachment: JsonRecord = { subnet };
  if (Array.isArray(securityGroups) && securityGroups.every((g) => typeof g === 'string')) {
    attachment.security_groups = securityGroups;
  }
  return { ...spec, network_attachments: [attachment] };
};

const serializeSpecValueToWire = (value: unknown, wireKey: string): unknown => {
  if (isEmptyWireValue(value)) {
    return undefined;
  }

  if (wireKey === 'template_parameters') {
    return serializeTemplateParametersWire(readRecord(value));
  }

  if (Array.isArray(value)) {
    const items = value
      .map((item) => serializeSpecValueToWire(item, wireKey))
      .filter((item) => !isEmptyWireValue(item));
    return items.length ? items : undefined;
  }

  if (typeof value === 'object') {
    return serializeSpecRecordToWire(value as JsonRecord);
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  return value;
};

/** Recursively serialize a spec object to fulfillment wire JSON (snake_case keys, omit empties). */
export const serializeSpecRecordToWire = (record: JsonRecord): JsonRecord | undefined => {
  const wire: JsonRecord = {};
  for (const [key, value] of Object.entries(record)) {
    if (isEmptyWireValue(value)) {
      continue;
    }
    const wireKey = camelToSnakeKey(key);
    const serialized = serializeSpecValueToWire(value, wireKey);
    if (!isEmptyWireValue(serialized)) {
      wire[wireKey] = serialized;
    }
  }
  return Object.keys(wire).length ? wire : undefined;
};

const serializeSpecForCreate = (
  spec: JsonRecord | undefined,
  opts?: { catalogItemOnly?: boolean; templateOnly?: boolean },
): Record<string, unknown> | undefined => {
  if (!spec) {
    return undefined;
  }

  const wire = serializeSpecRecordToWire(normalizeLegacyNetworkFields(spec));
  if (!wire) {
    return undefined;
  }

  const catalogItem = readStr(wire, 'catalog_item');
  const template = readStr(wire, 'template');

  if (opts?.catalogItemOnly && !catalogItem) {
    throw new Error('spec.catalog_item is required for catalog-item create');
  }
  if (opts?.templateOnly && !template) {
    throw new Error('spec.template is required for template create');
  }
  if (opts?.catalogItemOnly) {
    delete wire.template;
    delete wire.template_parameters;
  }
  if (opts?.templateOnly) {
    delete wire.catalog_item;
  }

  return Object.keys(wire).length ? wire : undefined;
};

export type BuildComputeInstanceCreateBodyInput = {
  id?: string;
  metadata?: { name?: string };
  spec?: JsonRecord;
};

export type BuildComputeInstanceCreateBodyOptions = {
  specCatalogItemOnly?: boolean;
  specTemplateOnly?: boolean;
};

/** Builds JSON body for `POST …/compute_instances` (ComputeInstance at root, snake_case fields). */
export const buildComputeInstanceCreateBody = (
  vm: BuildComputeInstanceCreateBodyInput,
  opts?: BuildComputeInstanceCreateBodyOptions,
): Record<string, unknown> => {
  const wire: JsonRecord = {};
  if (vm.id) {
    wire.id = vm.id;
  }
  const name = vm.metadata?.name?.trim();
  if (name) {
    wire.metadata = { name };
  }
  const spec = serializeSpecForCreate(vm.spec, {
    catalogItemOnly: opts?.specCatalogItemOnly,
    templateOnly: opts?.specTemplateOnly,
  });
  if (spec) {
    wire.spec = spec;
  }
  return wire;
};
