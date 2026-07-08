import type {
  BareMetalInstanceCatalogItem,
  ClusterCatalogItem,
  ComputeInstanceCatalogItem,
} from '@osac/types';

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
  | ComputeInstanceCatalogItem;

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
