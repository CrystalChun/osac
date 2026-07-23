import type {
  BareMetalInstanceCatalogItem,
  ClusterCatalogItem,
  ComputeInstanceCatalogItem,
} from '@osac/types';
import type {
  BareMetalInstanceCatalogItem as PrivateBareMetalInstanceCatalogItem,
  ClusterCatalogItem as PrivateClusterCatalogItem,
  ComputeInstanceCatalogItem as PrivateComputeInstanceCatalogItem,
} from '@osac/types/private';

import type { DemoShellRole } from '../../shellTypes';
import {
  CATALOG_ITEM_RESOURCE_FIELD_PATHS,
  type CatalogFieldDefinition,
  type CatalogItemResourceFieldPath,
  catalogItemFieldDefinitions,
  fieldDefinitionDefaultToInputString,
  isCatalogCardResourceFieldPath,
  isCatalogItemResourceFieldPath,
  isClusterCatalogItemResourceFieldPath,
  resolvedFieldDefault,
} from '../catalogProvision/catalogFieldDefinition';

export type CatalogItem =
  | ClusterCatalogItem
  | BareMetalInstanceCatalogItem
  | ComputeInstanceCatalogItem
  | PrivateClusterCatalogItem
  | PrivateBareMetalInstanceCatalogItem
  | PrivateComputeInstanceCatalogItem;

type PrivateCatalogItem =
  | PrivateClusterCatalogItem
  | PrivateBareMetalInstanceCatalogItem
  | PrivateComputeInstanceCatalogItem;

export type CatalogItemKind = 'vm' | 'cluster' | 'bm';

export const catalogFieldDefault = (item: CatalogItem, path: string): unknown => {
  const def = catalogItemFieldDefinitions(item).find((entry) => entry.path === path);
  return def ? resolvedFieldDefault(def) : undefined;
};

export const catalogItemSubtitle = (item: CatalogItem): string => {
  const description = item.description?.trim();
  if (description) {
    return description.length <= 120 ? description : `${description.slice(0, 119)}…`;
  }
  return item.metadata?.name ?? item.id;
};

export const catalogItemMetadataLabelEntries = (
  item: CatalogItem,
): Array<{ key: string; value: string }> => {
  const labels = item.metadata?.labels;
  if (!labels) {
    return [];
  }
  return Object.entries(labels)
    .map(([key, value]) => ({ key, value: value.trim() }))
    .filter(({ value }) => value.length > 0)
    .sort((a, b) => a.key.localeCompare(b.key));
};

export const catalogFieldDefinitionForPath = (
  item: CatalogItem,
  path: string,
): CatalogFieldDefinition | undefined => {
  return catalogItemFieldDefinitions(item).find((def) => def.path === path);
};

const FALLBACK_RESOURCE_LABELS: Record<CatalogItemResourceFieldPath, string> = {
  cores: 'vCPU',
  memory_gib: 'Memory',
  'boot_disk.size_gib': 'Boot disk',
};

/** Field definitions shown as resource labels on catalog cards (VM or cluster). */
export const catalogItemResourceFieldDefinitions = (
  item: CatalogItem,
): CatalogFieldDefinition[] => {
  const defs = catalogItemFieldDefinitions(item);
  const byPath = new Map(defs.map((def) => [def.path, def]));

  const vmResourceDefs = CATALOG_ITEM_RESOURCE_FIELD_PATHS.flatMap((path) => {
    const def = byPath.get(path);
    return def ? [def] : [];
  });
  if (vmResourceDefs.length > 0) {
    return vmResourceDefs;
  }

  return defs.filter((def) => isClusterCatalogItemResourceFieldPath(def.path));
};

const formatCatalogResourcePart = (def: CatalogFieldDefinition): string | null => {
  if (!isCatalogCardResourceFieldPath(def.path)) {
    return null;
  }
  const defaultValue = resolvedFieldDefault(def);
  if (defaultValue === undefined || defaultValue === null) {
    return null;
  }
  const value = fieldDefinitionDefaultToInputString(defaultValue).trim();
  if (!value) {
    return null;
  }
  const label = isCatalogItemResourceFieldPath(def.path)
    ? def.displayName || FALLBACK_RESOURCE_LABELS[def.path]
    : def.displayName;
  if (!label) {
    return null;
  }
  return `${value} ${label}`;
};

export const catalogItemResourceParts = (item: CatalogItem): string[] => {
  return catalogItemResourceFieldDefinitions(item)
    .map((def) => formatCatalogResourcePart(def))
    .filter((part): part is string => part != null);
};

export const catalogItemResourceLine = (item: CatalogItem): string | undefined => {
  const parts = catalogItemResourceParts(item);
  return parts.length ? parts.join(' · ') : undefined;
};

export const searchableCatalogItemText = (item: CatalogItem): string => {
  const labels = item.metadata?.labels ?? {};
  const fieldText = catalogItemFieldDefinitions(item)
    .map(
      (def) =>
        `${def.displayName} ${fieldDefinitionDefaultToInputString(resolvedFieldDefault(def))}`,
    )
    .join(' ');

  return [
    item.title,
    item.description,
    item.metadata?.name,
    fieldText,
    ...Object.entries(labels).map(([key, value]) => `${key} ${value}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const filterCatalogItemsBySearch = (items: CatalogItem[], search: string): CatalogItem[] => {
  const searchTerm = search.trim().toLowerCase();
  if (!searchTerm) {
    return items;
  }
  return items.filter((item) => searchableCatalogItemText(item).includes(searchTerm));
};

export const formatCatalogFieldDefault = (def: CatalogFieldDefinition): string => {
  const defaultValue = resolvedFieldDefault(def);
  if (defaultValue === undefined) {
    return '—';
  }
  return fieldDefinitionDefaultToInputString(defaultValue) || '—';
};

/**
 * fulfillment-service's built-in global tenant. Every object without an explicit tenant is
 * auto-assigned this value server-side, and it round-trips unmasked through the public API's
 * `metadata.tenant` field even though the business `tenant` field is stripped from public catalog
 * item responses entirely.
 */
export const SHARED_TENANT = 'shared';

export type CatalogItemScope =
  | { level: 'general' }
  | { level: 'organization'; name?: string }
  | { level: 'project'; name: string };

const isPrivateCatalogItem = (item: CatalogItem): item is PrivateCatalogItem => 'tenant' in item;

export const catalogItemScope = (item: CatalogItem, role: DemoShellRole): CatalogItemScope => {
  const project = item.metadata?.project ?? '';
  if (project) {
    return { level: 'project', name: project };
  }
  if (role === 'providerAdmin') {
    const tenant = isPrivateCatalogItem(item) ? item.tenant : '';
    return tenant ? { level: 'organization', name: tenant } : { level: 'general' };
  }
  const metadataTenant = item.metadata?.tenant ?? '';
  return metadataTenant === SHARED_TENANT || !metadataTenant
    ? { level: 'general' }
    : { level: 'organization' };
};
