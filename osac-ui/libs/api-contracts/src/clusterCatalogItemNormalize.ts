/**
 * Fulfillment wire (PROTO_JSON / snake_case) → UI ClusterCatalogItem.
 * Stub for future cluster catalog provisioning; mirrors compute_instance_catalog_items shape.
 */
import { normalizeCatalogFieldDefinitions } from './catalogFieldDefinition.js';
import type { ClusterCatalogItem, Metadata, PageOfT } from './types.js';

const asRecord = (v: unknown): Record<string, unknown> => {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
};

const readStr = (obj: Record<string, unknown>, a: string, b?: string): string | undefined => {
  for (const k of b ? [a, b] : [a]) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
};

const readBool = (obj: Record<string, unknown>, a: string, b?: string): boolean | undefined => {
  for (const k of b ? [a, b] : [a]) {
    const v = obj[k];
    if (typeof v === 'boolean') {
      return v;
    }
  }
  return undefined;
};

const readLabels = (obj: Record<string, unknown>): Record<string, string> | undefined => {
  const raw = obj.labels;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'string') {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
};

const normalizeMetadata = (raw: Record<string, unknown>, fallbackName: string): Metadata => {
  const name = String(readStr(raw, 'name') ?? fallbackName);
  return {
    name,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    labels: readLabels(raw),
    createdAt: readStr(raw, 'creation_timestamp', 'createdAt'),
    creators: Array.isArray(raw.creators)
      ? raw.creators.filter((x): x is string => typeof x === 'string')
      : undefined,
    tenants: Array.isArray(raw.tenants)
      ? raw.tenants.filter((x): x is string => typeof x === 'string')
      : undefined,
  };
};

export const normalizeClusterCatalogItem = (raw: unknown): ClusterCatalogItem => {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid cluster_catalog_item payload');
  }
  const r = raw as Record<string, unknown>;
  const mdIn = asRecord(r.metadata);
  const id = String((r.id ?? mdIn.name ?? '') as string);
  const template = readStr(r, 'template');
  if (!template) {
    throw new Error('cluster_catalog_item: missing template reference');
  }

  const fieldDefinitions = normalizeCatalogFieldDefinitions(
    r.field_definitions ?? r.fieldDefinitions,
  );

  return {
    id,
    metadata: normalizeMetadata(mdIn, id),
    title: String((r.title ?? mdIn.name ?? id) as string),
    description: readStr(r, 'description'),
    template,
    published: readBool(r, 'published') ?? false,
    ...(fieldDefinitions.length ? { fieldDefinitions } : {}),
  };
};

export const normalizeClusterCatalogItemPage = (raw: unknown): PageOfT<ClusterCatalogItem> => {
  const r = asRecord(raw);
  const itemsRaw = r.items;
  if (!Array.isArray(itemsRaw)) {
    throw new Error('cluster_catalog_items page: missing items array');
  }
  const items = itemsRaw.map(normalizeClusterCatalogItem);
  const size = typeof r.size === 'number' ? r.size : items.length;
  const total = typeof r.total === 'number' ? r.total : items.length;
  return { size, total, items };
};
