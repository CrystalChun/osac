import type { Metadata, Organization, PageOfT } from './types.js';

const asRecord = (v: unknown): Record<string, unknown> => {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
};

const readStr = (obj: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
};

const normalizeMetadata = (raw: unknown): Metadata => {
  const o = asRecord(raw);
  const name = readStr(o, 'name') ?? '';
  const createdAt = readStr(o, 'creation_timestamp', 'creationTimestamp');
  const labelsRaw = o.labels;
  const labels =
    labelsRaw && typeof labelsRaw === 'object' && !Array.isArray(labelsRaw)
      ? Object.fromEntries(
          Object.entries(labelsRaw).filter(([, v]) => typeof v === 'string') as [string, string][],
        )
      : undefined;
  return {
    name,
    ...(createdAt ? { createdAt } : {}),
    ...(labels && Object.keys(labels).length ? { labels } : {}),
  };
};

export const normalizeOrganization = (raw: unknown): Organization => {
  const o = asRecord(raw);
  const id = readStr(o, 'id') ?? readStr(asRecord(o.metadata), 'name') ?? '';
  const metadata = normalizeMetadata(o.metadata);
  const displayName = readStr(o, 'display_name', 'displayName') ?? (metadata.name || id);
  const description = readStr(o, 'description');
  const status = readStr(o, 'status');
  const vmCountRaw = o.vm_count ?? o.vmCount;
  const vmCount = typeof vmCountRaw === 'number' ? vmCountRaw : undefined;
  return {
    id,
    metadata,
    displayName,
    ...(description ? { description } : {}),
    ...(status ? { status } : {}),
    ...(vmCount != null ? { vmCount } : {}),
  };
};

export const normalizeOrganizationPage = (raw: unknown): PageOfT<Organization> => {
  const o = asRecord(raw);
  const itemsRaw = o.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map((item) => normalizeOrganization(item)) : [];
  const size = typeof o.size === 'number' ? o.size : items.length;
  const total = typeof o.total === 'number' ? o.total : items.length;
  return { size, total, items };
};
