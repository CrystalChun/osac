import type { Metadata, PageOfT, User } from './types.js';

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
  return {
    name,
    ...(createdAt ? { createdAt } : {}),
  };
};

export const normalizeUser = (raw: unknown): User => {
  const o = asRecord(raw);
  const id = readStr(o, 'id') ?? readStr(asRecord(o.metadata), 'name') ?? '';
  const metadata = normalizeMetadata(o.metadata);
  const displayName = readStr(o, 'display_name', 'displayName') ?? (metadata.name || id);
  const email = readStr(o, 'email');
  const role = readStr(o, 'role');
  const status = readStr(o, 'status');
  const lastLogin = readStr(o, 'last_login', 'lastLogin');
  return {
    id,
    metadata,
    displayName,
    ...(email ? { email } : {}),
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(lastLogin ? { lastLogin } : {}),
  };
};

export const normalizeUserPage = (raw: unknown): PageOfT<User> => {
  const o = asRecord(raw);
  const itemsRaw = o.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map((item) => normalizeUser(item)) : [];
  const size = typeof o.size === 'number' ? o.size : items.length;
  const total = typeof o.total === 'number' ? o.total : items.length;
  return { size, total, items };
};
