/**
 * Catalog item field_definitions — parse defaults, validate against JSON Schema subset, apply to spec paths.
 */

import { protobufValueToPlain } from './protobuf-value';

export type CatalogProvisionKind = 'compute_instance' | 'cluster';

/** Wizard-built spec — camelCase nested fields (serialized to wire JSON at create time). */
export type WizardComputeInstanceSpec = Record<string, unknown> & {
  template?: string;
  catalogItem?: string;
  networkAttachments?: Array<{ subnet: string; securityGroups?: string[] }>;
  additionalDisks?: Array<{ sizeGib: number }>;
};

export interface CatalogFieldDefinition {
  path: string;
  displayName: string;
  editable: boolean;
  default?: unknown;
  validationSchema?: Record<string, unknown>;
}

const asRecord = (v: unknown): Record<string, unknown> | undefined => {
  return v && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
};

const unknownToString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
};

/** Parse google.protobuf.Value default (wire JSON or post-decode protobuf message). */
export const parseFieldDefinitionDefault = (raw: unknown): unknown => {
  if (raw == null) {
    return undefined;
  }
  if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'boolean') {
    return raw;
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  const r = asRecord(raw);
  if (!r) {
    return undefined;
  }
  const decodedKind = asRecord(r.kind);
  const hasDecodedDiscriminator =
    typeof decodedKind?.case === 'string' && decodedKind.case.length > 0;
  const hasWireDiscriminator =
    'null_value' in r ||
    'number_value' in r ||
    'string_value' in r ||
    'bool_value' in r ||
    'list_value' in r ||
    'struct_value' in r;
  if (!hasDecodedDiscriminator && !hasWireDiscriminator) {
    return raw;
  }
  const plain = protobufValueToPlain(raw);
  return plain === undefined ? undefined : plain;
};

const parseValidationSchema = (raw: unknown): Record<string, unknown> | undefined => {
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return asRecord(parsed);
    } catch {
      return undefined;
    }
  }
  return asRecord(raw);
};

export const normalizeCatalogFieldDefinition = (raw: unknown): CatalogFieldDefinition | null => {
  const r = asRecord(raw);
  if (!r) {
    return null;
  }
  const path = unknownToString(r.path ?? r.Path).trim();
  if (!path) {
    return null;
  }
  const displayName = unknownToString(
    r.display_name ?? r.displayName ?? r.DisplayName ?? path,
  ).trim();
  const editable = typeof r.editable === 'boolean' ? r.editable : true;
  const defaultRaw = r.default ?? r.Default;
  const defaultValue =
    defaultRaw !== undefined && defaultRaw !== null
      ? parseFieldDefinitionDefault(defaultRaw)
      : undefined;
  const validationSchema = parseValidationSchema(r.validation_schema ?? r.validationSchema);

  return {
    path,
    displayName: displayName || path,
    editable,
    ...(defaultValue !== undefined ? { default: defaultValue } : {}),
    ...(validationSchema ? { validationSchema } : {}),
  };
};

export const normalizeCatalogFieldDefinitions = (raw: unknown): CatalogFieldDefinition[] => {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map(normalizeCatalogFieldDefinition)
    .filter((x): x is CatalogFieldDefinition => Boolean(x));
};

export const readCatalogItemFieldDefinitions = (item: unknown): readonly unknown[] | undefined => {
  if (!item || typeof item !== 'object') {
    return undefined;
  }
  const raw =
    (item as Record<string, unknown>).field_definitions ??
    (item as Record<string, unknown>).fieldDefinitions;
  return Array.isArray(raw) ? raw : undefined;
};

export const coerceCatalogFieldDefinitions = (
  definitions: readonly unknown[] | undefined,
): CatalogFieldDefinition[] => {
  if (!definitions?.length) {
    return [];
  }
  return definitions
    .map((raw) => normalizeCatalogFieldDefinition(raw))
    .filter((x): x is CatalogFieldDefinition => Boolean(x));
};

/** Normalized field_definitions from wire or test catalog item JSON. */
export const catalogItemFieldDefinitions = (item: unknown): CatalogFieldDefinition[] => {
  return coerceCatalogFieldDefinitions(readCatalogItemFieldDefinitions(item));
};

/** Spec paths shown on catalog cards as compute resources (CPU, memory, boot disk). */
export const CATALOG_ITEM_RESOURCE_FIELD_PATHS = [
  'cores',
  'memory_gib',
  'boot_disk.size_gib',
] as const;

export type CatalogItemResourceFieldPath = (typeof CATALOG_ITEM_RESOURCE_FIELD_PATHS)[number];

const catalogItemResourceFieldPathSet = new Set<string>(CATALOG_ITEM_RESOURCE_FIELD_PATHS);

export const isCatalogItemResourceFieldPath = (
  path: string,
): path is CatalogItemResourceFieldPath => {
  return catalogItemResourceFieldPathSet.has(path);
};

/** Node-set host type and worker count paths on cluster catalog cards (node set id varies). */
export const CLUSTER_CATALOG_ITEM_RESOURCE_FIELD_PATH_PATTERN =
  /^node_sets\.[^.]+\.(host_type|size)$/;

export const isClusterCatalogItemResourceFieldPath = (path: string): boolean => {
  return CLUSTER_CATALOG_ITEM_RESOURCE_FIELD_PATH_PATTERN.test(path);
};

export const isCatalogCardResourceFieldPath = (path: string): boolean => {
  return isCatalogItemResourceFieldPath(path) || isClusterCatalogItemResourceFieldPath(path);
};

export const fieldDefinitionDefaultToInputString = (value: unknown): string => {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(', ');
  }
  return '';
};

const snakeToCamel = (segment: string): string => {
  return segment.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
};

const wirePathToCamelPath = (wirePath: string): string => {
  return wirePath
    .split('.')
    .map((segment) => snakeToCamel(segment))
    .join('.');
};

const setNestedValue = (target: Record<string, unknown>, path: string, value: unknown): void => {
  const parts = path.split('.');
  let cur: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = cur[key];
    if (!next || typeof next !== 'object' || Array.isArray(next)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
};

/** Apply a wire-relative spec path value onto UI ComputeInstanceSpec (camelCase nested fields). */
export const setSpecValueAtFieldPath = (
  spec: WizardComputeInstanceSpec,
  wirePath: string,
  value: unknown,
): void => {
  const path = wirePath.trim();
  if (!path) {
    return;
  }

  if (path === 'subnet' || path === 'network_attachments.0.subnet') {
    const subnet = String(value);
    const existing = spec.networkAttachments?.[0];
    spec.networkAttachments = [
      {
        subnet,
        ...(existing?.securityGroups?.length ? { securityGroups: existing.securityGroups } : {}),
      },
    ];
    return;
  }

  if (path === 'security_groups' || path === 'network_attachments.0.security_groups') {
    const groups = Array.isArray(value)
      ? value.filter((g): g is string => typeof g === 'string' && g.trim().length > 0)
      : parseSecurityGroupsRaw(String(value));
    const existing = spec.networkAttachments?.[0];
    if (existing?.subnet) {
      spec.networkAttachments = [
        {
          subnet: existing.subnet,
          ...(groups.length ? { securityGroups: groups } : {}),
        },
      ];
    } else if (groups.length) {
      spec.networkAttachments = [{ subnet: '', securityGroups: groups }];
    }
    return;
  }

  if (path === 'image.source_type' || path === 'image.source_ref') {
    const image: Record<string, unknown> = { ...(asRecord(spec.image) ?? {}) };
    const camelKey = path === 'image.source_type' ? 'source_type' : 'source_ref';
    image[camelKey] = value;
    spec.image = image;
    return;
  }

  if (path === 'additional_disks') {
    const disks = Array.isArray(value)
      ? value.map((item) => {
          if (typeof item === 'number') {
            return { sizeGib: item };
          }
          if (item && typeof item === 'object') {
            const rec = item as Record<string, unknown>;
            const n = rec.size_gib ?? rec.sizeGib;
            if (typeof n === 'number') {
              return { sizeGib: n };
            }
          }
          return { sizeGib: Number(item) };
        })
      : [];
    spec.additionalDisks = disks;
    return;
  }

  const camelPath = wirePathToCamelPath(path);
  const root = spec as unknown as Record<string, unknown>;
  setNestedValue(root, camelPath, value);
};

export interface FieldValidationContext {
  displayName?: string;
}

const fieldLabel = (context?: FieldValidationContext): string => {
  const label = context?.displayName?.trim();
  return label || 'This field';
};

/** Compile JSON Schema `pattern` (ECMAScript regex) for client-side validation. */
export const compileJsonSchemaPattern = (pattern: unknown): RegExp | undefined => {
  if (typeof pattern !== 'string' || !pattern.trim()) {
    return undefined;
  }
  try {
    return new RegExp(pattern);
  } catch {
    return undefined;
  }
};

export const jsonSchemaPatternErrorMessage = (label: string, pattern: string): string =>
  `${label} must match pattern: ${pattern}`;

export const matchesJsonSchemaPattern = (
  value: string,
  schema: Record<string, unknown>,
): boolean => {
  const regex = compileJsonSchemaPattern(schema.pattern);
  if (!regex) {
    return true;
  }
  return regex.test(value);
};

export const validateValueAgainstJsonSchema = (
  value: unknown,
  schema: Record<string, unknown> | undefined,
  context?: FieldValidationContext,
): string | null => {
  if (!schema || !Object.keys(schema).length) {
    return null;
  }

  const label = fieldLabel(context);
  const type = schema.type;
  if (type === 'integer' || type === 'number') {
    const n = typeof value === 'number' ? value : Number(String(value).trim());
    const min = typeof schema.minimum === 'number' ? schema.minimum : undefined;
    const max = typeof schema.maximum === 'number' ? schema.maximum : undefined;
    const hasMin = min !== undefined;
    const hasMax = max !== undefined;

    if (!Number.isFinite(n)) {
      return `${label} must be a valid number.`;
    }
    if (type === 'integer' && !Number.isInteger(n)) {
      return `${label} must be a whole number.`;
    }
    if (hasMin && hasMax) {
      if (n < min) {
        return `${label} must be between ${min} and ${max}. The value you entered is too low.`;
      }
      if (n > max) {
        return `${label} must be between ${min} and ${max}. The value you entered is too high.`;
      }
      return null;
    }
    if (hasMin && n < min) {
      return `${label} must be ${min} or greater.`;
    }
    if (hasMax && n > max) {
      return `${label} must be ${max} or less.`;
    }
    return null;
  }

  if (type === 'string') {
    const s = typeof value === 'string' ? value : unknownToString(value);
    const minLen = typeof schema.minLength === 'number' ? schema.minLength : undefined;
    const maxLen = typeof schema.maxLength === 'number' ? schema.maxLength : undefined;
    const hasMin = minLen !== undefined;
    const hasMax = maxLen !== undefined;

    if (hasMin && hasMax) {
      if (s.length < minLen) {
        return `${label} must be between ${minLen} and ${maxLen} characters. The value you entered is too short.`;
      }
      if (s.length > maxLen) {
        return `${label} must be between ${minLen} and ${maxLen} characters. The value you entered is too long.`;
      }
      return null;
    }
    if (hasMin && s.length < minLen) {
      return `${label} must be at least ${minLen} characters long.`;
    }
    if (hasMax && s.length > maxLen) {
      return `${label} must be no more than ${maxLen} characters long.`;
    }
    if (!matchesJsonSchemaPattern(s, schema)) {
      const pattern = typeof schema.pattern === 'string' ? schema.pattern : '';
      return jsonSchemaPatternErrorMessage(label, pattern);
    }
    return null;
  }

  if (type === 'boolean') {
    if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
      return `${label} must be true or false.`;
    }
    return null;
  }

  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && enumValues.length > 0) {
    const s = typeof value === 'string' ? value : unknownToString(value);
    if (!enumValues.some((entry) => String(entry) === s)) {
      return `${label} must be one of: ${enumValues.map(String).join(', ')}.`;
    }
    return null;
  }

  return null;
};

export const parseFieldValueForSchema = (
  raw: string,
  schema: Record<string, unknown> | undefined,
): unknown => {
  const trimmed = raw.trim();
  const type = schema?.type;
  if (type === 'integer' || type === 'number') {
    return trimmed === '' ? undefined : Number(trimmed);
  }
  if (type === 'boolean') {
    if (trimmed === '') {
      return undefined;
    }
    return trimmed === 'true';
  }
  return trimmed === '' ? undefined : trimmed;
};

/** Basics-step field paths per catalog provision kind (spec-relative wire paths). */
export const COMPUTE_INSTANCE_BASICS_FIELD_PATHS = ['ssh_key', 'pull_secret'] as const;
export const CLUSTER_BASICS_FIELD_PATHS = ['ssh_public_key', 'pull_secret'] as const;

export const catalogBasicsFieldPaths = (kind: CatalogProvisionKind): readonly string[] => {
  return kind === 'cluster' ? CLUSTER_BASICS_FIELD_PATHS : COMPUTE_INSTANCE_BASICS_FIELD_PATHS;
};

export const isCatalogBasicsFieldPath = (path: string, kind: CatalogProvisionKind): boolean => {
  return catalogBasicsFieldPaths(kind).includes(path);
};

const NETWORK_SUBNET_PATHS = new Set(['subnet', 'network_attachments.0.subnet']);
const NETWORK_SECURITY_GROUPS_PATHS = new Set([
  'security_groups',
  'network_attachments.0.security_groups',
]);

export const isNetworkAttachmentSubnetFieldPath = (path: string): boolean => {
  return NETWORK_SUBNET_PATHS.has(path) || /^network_attachments\.\d+\.subnet$/.test(path);
};

export const isNetworkAttachmentSecurityGroupsFieldPath = (path: string): boolean => {
  return (
    NETWORK_SECURITY_GROUPS_PATHS.has(path) ||
    /^network_attachments\.\d+\.security_groups$/.test(path)
  );
};

export const isNetworkAttachmentFieldPath = (path: string): boolean => {
  return (
    isNetworkAttachmentSubnetFieldPath(path) || isNetworkAttachmentSecurityGroupsFieldPath(path)
  );
};

export interface NetworkAttachmentFieldBundle {
  subnetDef: CatalogFieldDefinition | null;
  securityGroupsDef: CatalogFieldDefinition | null;
}

/** Editable subnet / security_groups field definitions for the coupled network UI. */
export const getNetworkAttachmentFieldBundle = (
  definitions: readonly unknown[] | undefined,
): NetworkAttachmentFieldBundle => {
  const defs = coerceCatalogFieldDefinitions(definitions);
  const subnetDef =
    defs.find((d) => isNetworkAttachmentSubnetFieldPath(d.path) && d.editable) ?? null;
  const securityGroupsDef =
    defs.find((d) => isNetworkAttachmentSecurityGroupsFieldPath(d.path) && d.editable) ?? null;
  return { subnetDef, securityGroupsDef };
};

export const hasEditableNetworkAttachmentFields = (
  bundle: NetworkAttachmentFieldBundle,
): boolean => {
  return Boolean(bundle.subnetDef || bundle.securityGroupsDef);
};

export interface NetworkAttachmentRowInput {
  subnet: string;
  securityGroupsRaw: string;
}

export const parseSecurityGroupsRaw = (raw: string): string[] => {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
};

export const buildNetworkAttachmentsFromRows = (
  rows: NetworkAttachmentRowInput[],
): WizardComputeInstanceSpec['networkAttachments'] => {
  const attachments = rows
    .map((row) => {
      const subnet = row.subnet.trim();
      const securityGroups = parseSecurityGroupsRaw(row.securityGroupsRaw);
      if (!subnet) {
        return null;
      }
      return {
        subnet,
        ...(securityGroups.length ? { securityGroups } : {}),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry != null);
  return attachments.length ? attachments : undefined;
};

export const seedNetworkAttachmentRowsFromCatalogItem = (
  definitions: readonly unknown[] | undefined,
): NetworkAttachmentRowInput[] => {
  const bundle = getNetworkAttachmentFieldBundle(definitions);
  if (!hasEditableNetworkAttachmentFields(bundle)) {
    return [];
  }
  const subnet =
    bundle.subnetDef !== null && bundle.subnetDef.default !== undefined
      ? fieldDefinitionDefaultToInputString(resolvedFieldDefault(bundle.subnetDef))
      : '';
  const securityGroupsRaw =
    bundle.securityGroupsDef !== null && bundle.securityGroupsDef.default !== undefined
      ? fieldDefinitionDefaultToInputString(resolvedFieldDefault(bundle.securityGroupsDef))
      : '';
  return [{ subnet, securityGroupsRaw }];
};

export const configurationFieldsExcludingNetwork = (
  configuration: CatalogFieldDefinition[],
): CatalogFieldDefinition[] => {
  return configuration.filter((def) => !isNetworkAttachmentFieldPath(def.path));
};

export const hasConfigurationStepContent = (
  definitions: readonly unknown[] | undefined,
  kind: CatalogProvisionKind,
): boolean => {
  const { configuration } = partitionFieldDefinitions(definitions, kind);
  const other = configurationFieldsExcludingNetwork(configuration);
  const network = getNetworkAttachmentFieldBundle(definitions);
  return other.length > 0 || hasEditableNetworkAttachmentFields(network);
};

export const shouldIncludeConfigurationStep = (
  catalogItem: unknown,
  kind: CatalogProvisionKind,
): boolean => {
  if (!catalogItem) {
    return true;
  }
  return hasConfigurationStepContent(readCatalogItemFieldDefinitions(catalogItem), kind);
};

export interface PartitionedFieldDefinitions {
  basics: CatalogFieldDefinition[];
  configuration: CatalogFieldDefinition[];
  review: CatalogFieldDefinition[];
}

/** Split field_definitions into wizard steps; preserves catalog array order. */
export const partitionFieldDefinitions = (
  definitions: readonly unknown[] | undefined,
  kind: CatalogProvisionKind,
): PartitionedFieldDefinitions => {
  const defs = coerceCatalogFieldDefinitions(definitions);
  const basicsPaths = new Set(catalogBasicsFieldPaths(kind));
  const basics: CatalogFieldDefinition[] = [];
  const configuration: CatalogFieldDefinition[] = [];

  for (const def of defs) {
    if (basicsPaths.has(def.path)) {
      if (def.editable) {
        basics.push(def);
      }
    } else if (def.editable) {
      configuration.push(def);
    }
  }

  return { basics, configuration, review: defs };
};

export const parseAdditionalDisksRaw = (raw: string): Array<{ sizeGib: number }> | undefined => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  const disks = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((n) => Number.isFinite(n))
    .map((sizeGib) => ({ sizeGib }));
  return disks.length ? disks : undefined;
};

export const resolvedFieldDefault = (def: CatalogFieldDefinition): unknown => {
  if (def.default === undefined) {
    return undefined;
  }
  const parsed = parseFieldDefinitionDefault(def.default);
  return parsed !== undefined ? parsed : def.default;
};

export const resolvedFieldInputValue = (
  def: CatalogFieldDefinition,
  fieldValues: Record<string, string>,
): string => {
  const raw = fieldValues[def.path]?.trim();
  if (raw) {
    return raw;
  }
  if (def.default !== undefined) {
    return fieldDefinitionDefaultToInputString(resolvedFieldDefault(def));
  }
  return '';
};

export const resolvedFieldValueForCreate = (
  def: CatalogFieldDefinition,
  fieldValues: Record<string, string>,
): unknown => {
  if (def.editable) {
    const raw = fieldValues[def.path] ?? '';
    const trimmed = raw.trim();
    if (trimmed) {
      if (def.path === 'additional_disks') {
        return parseAdditionalDisksRaw(raw);
      }
      return def.validationSchema ? parseFieldValueForSchema(raw, def.validationSchema) : trimmed;
    }
    return resolvedFieldDefault(def);
  }
  return resolvedFieldDefault(def);
};

export const applyFieldDefinitionsToSpec = (
  spec: WizardComputeInstanceSpec,
  definitions: readonly unknown[],
  fieldValues: Record<string, string>,
  options?: { skipNetworkAttachmentFields?: boolean },
): void => {
  for (const def of coerceCatalogFieldDefinitions(definitions)) {
    if (options?.skipNetworkAttachmentFields && isNetworkAttachmentFieldPath(def.path)) {
      continue;
    }
    const value = resolvedFieldValueForCreate(def, fieldValues);
    if (value !== undefined && value !== null && value !== '') {
      setSpecValueAtFieldPath(spec, def.path, value);
    }
  }
};

export const validateCatalogFieldInput = (
  def: CatalogFieldDefinition,
  raw: string,
): string | null => {
  if (!def.editable) {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed === '') {
    return null;
  }

  if (def.path === 'additional_disks') {
    const disks = parseAdditionalDisksRaw(raw);
    if (!disks?.length) {
      return `${def.displayName} must be comma-separated disk sizes in GiB.`;
    }
    return null;
  }

  if (def.validationSchema) {
    const parsed = parseFieldValueForSchema(raw, def.validationSchema);
    return validateValueAgainstJsonSchema(parsed, def.validationSchema, {
      displayName: def.displayName,
    });
  }

  return null;
};

export const seedFieldValuesFromCatalogItem = (
  definitions: readonly unknown[] | undefined,
): Record<string, string> => {
  const values: Record<string, string> = {};
  for (const def of coerceCatalogFieldDefinitions(definitions)) {
    const defaultValue = resolvedFieldDefault(def);
    if (defaultValue !== undefined) {
      values[def.path] = fieldDefinitionDefaultToInputString(defaultValue);
    }
  }
  return values;
};
