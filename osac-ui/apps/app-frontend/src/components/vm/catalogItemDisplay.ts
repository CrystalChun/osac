import {
  CATALOG_ITEM_RESOURCE_FIELD_PATHS,
  type CatalogFieldDefinition,
  type CatalogItemResourceFieldPath,
  catalogItemFieldDefinitions,
  fieldDefinitionDefaultToInputString,
  isCatalogItemResourceFieldPath,
  resolvedFieldDefault,
} from '../catalogProvision/catalogFieldDefinition';

/** Minimal catalog item shape for display helpers — wire JSON and wizard drafts. */
export type CatalogItemForDisplay = {
  id: string;
  title: string;
  description?: string;
  template?: string;
  published?: boolean;
  metadata?: {
    name?: string;
    labels?: Record<string, string>;
  };
  fieldDefinitions?: ReadonlyArray<{
    path: string;
    displayName?: string;
    display_name?: string;
    editable?: boolean;
    default?: unknown;
    validationSchema?: unknown;
    validation_schema?: unknown;
  }>;
  field_definitions?: CatalogItemForDisplay['fieldDefinitions'];
};

export const catalogFieldDefault = (item: CatalogItemForDisplay, path: string): unknown => {
  const def = catalogItemFieldDefinitions(item).find((entry) => entry.path === path);
  return def ? resolvedFieldDefault(def) : undefined;
};

export const catalogItemSubtitle = (item: CatalogItemForDisplay): string => {
  const description = item.description?.trim();
  if (description) {
    return description.length <= 120 ? description : `${description.slice(0, 119)}…`;
  }
  return item.metadata?.name ?? item.id;
};

export const catalogItemMetadataLabelEntries = (
  item: CatalogItemForDisplay,
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
  item: CatalogItemForDisplay,
  path: string,
): CatalogFieldDefinition | undefined => {
  return catalogItemFieldDefinitions(item).find((def) => def.path === path);
};

const FALLBACK_RESOURCE_LABELS: Record<CatalogItemResourceFieldPath, string> = {
  cores: 'vCPU',
  memory_gib: 'Memory',
  'boot_disk.size_gib': 'Boot disk',
};

/** Field definitions that represent compute resources for catalog card summaries. */
export const catalogItemResourceFieldDefinitions = (
  item: CatalogItemForDisplay,
): CatalogFieldDefinition[] => {
  const byPath = new Map(catalogItemFieldDefinitions(item).map((def) => [def.path, def]));
  return CATALOG_ITEM_RESOURCE_FIELD_PATHS.flatMap((path) => {
    const def = byPath.get(path);
    return def ? [def] : [];
  });
};

const formatCatalogResourcePart = (def: CatalogFieldDefinition): string | null => {
  if (!isCatalogItemResourceFieldPath(def.path)) {
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
  const label = def.displayName || FALLBACK_RESOURCE_LABELS[def.path];
  return `${value} ${label}`;
};

export const catalogItemResourceParts = (item: CatalogItemForDisplay): string[] => {
  return catalogItemResourceFieldDefinitions(item)
    .map((def) => formatCatalogResourcePart(def))
    .filter((part): part is string => part != null);
};

export const catalogItemResourceLine = (item: CatalogItemForDisplay): string | undefined => {
  const parts = catalogItemResourceParts(item);
  return parts.length ? parts.join(' · ') : undefined;
};

export const searchableCatalogItemText = (item: CatalogItemForDisplay): string => {
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

export const formatCatalogFieldDefault = (def: CatalogFieldDefinition): string => {
  const defaultValue = resolvedFieldDefault(def);
  if (defaultValue === undefined) {
    return '—';
  }
  return fieldDefinitionDefaultToInputString(defaultValue) || '—';
};
