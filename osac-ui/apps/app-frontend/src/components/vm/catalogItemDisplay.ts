import type { CatalogFieldDefinition, CatalogItemBase } from '@osac/api-contracts/types';
import {
  CATALOG_ITEM_RESOURCE_FIELD_PATHS,
  type CatalogItemResourceFieldPath,
  fieldDefinitionDefaultToInputString,
  isCatalogItemResourceFieldPath,
} from '@osac/api-contracts/catalogFieldDefinition';

export const catalogFieldDefault = (item: CatalogItemBase, path: string): unknown => {
  return item.fieldDefinitions?.find((def) => def.path === path)?.default;
};

export const catalogItemSubtitle = (item: CatalogItemBase): string => {
  const description = item.description?.trim();
  if (description) {
    return description.length <= 120 ? description : `${description.slice(0, 119)}…`;
  }
  return item.metadata.name;
};

export const catalogItemMetadataLabelEntries = (
  item: CatalogItemBase,
): Array<{ key: string; value: string }> => {
  const labels = item.metadata.labels;
  if (!labels) {
    return [];
  }
  return Object.entries(labels)
    .map(([key, value]) => ({ key, value: value.trim() }))
    .filter(({ value }) => value.length > 0)
    .sort((a, b) => a.key.localeCompare(b.key));
};

export const catalogFieldDefinitionForPath = (
  item: CatalogItemBase,
  path: string,
): CatalogFieldDefinition | undefined => {
  return item.fieldDefinitions?.find((def) => def.path === path);
};

const FALLBACK_RESOURCE_LABELS: Record<CatalogItemResourceFieldPath, string> = {
  cores: 'vCPU',
  memory_gib: 'Memory',
  'boot_disk.size_gib': 'Boot disk',
};

/** Field definitions that represent compute resources for catalog card summaries. */
export const catalogItemResourceFieldDefinitions = (
  item: CatalogItemBase,
): CatalogFieldDefinition[] => {
  const byPath = new Map((item.fieldDefinitions ?? []).map((def) => [def.path, def]));
  return CATALOG_ITEM_RESOURCE_FIELD_PATHS.flatMap((path) => {
    const def = byPath.get(path);
    return def ? [def] : [];
  });
};

const formatCatalogResourcePart = (def: CatalogFieldDefinition): string | null => {
  if (!isCatalogItemResourceFieldPath(def.path)) {
    return null;
  }
  const defaultValue = def.default;
  if (defaultValue === undefined || defaultValue === null) {
    return null;
  }
  const value = fieldDefinitionDefaultToInputString(defaultValue).trim();
  if (!value) {
    return null;
  }
  const label = def.displayName || FALLBACK_RESOURCE_LABELS[def.path];
  return `${value} ${label}`;
};

export const catalogItemResourceParts = (item: CatalogItemBase): string[] => {
  return catalogItemResourceFieldDefinitions(item)
    .map((def) => formatCatalogResourcePart(def))
    .filter((part): part is string => part != null);
};

export const catalogItemResourceLine = (item: CatalogItemBase): string | undefined => {
  const parts = catalogItemResourceParts(item);
  return parts.length ? parts.join(' · ') : undefined;
};

export const searchableCatalogItemText = (item: CatalogItemBase): string => {
  const labels = item.metadata.labels ?? {};
  const fieldText = (item.fieldDefinitions ?? [])
    .map((def) => `${def.displayName} ${fieldDefinitionDefaultToInputString(def.default)}`)
    .join(' ');

  return [
    item.title,
    item.description,
    item.metadata.name,
    fieldText,
    ...Object.entries(labels).map(([key, value]) => `${key} ${value}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

export const formatCatalogFieldDefault = (def: CatalogFieldDefinition): string => {
  if (def.default === undefined) {
    return '—';
  }
  return fieldDefinitionDefaultToInputString(def.default) || '—';
};
