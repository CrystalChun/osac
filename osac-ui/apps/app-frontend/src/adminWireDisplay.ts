import type { Organization, User } from '@osac/types';

const readStr = (obj: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) {
      return v.trim();
    }
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const readUserDisplayName = (user: User): string => {
  const extras = asRecord(user);
  const fromExtras = readStr(extras, 'display_name', 'displayName');
  if (fromExtras) {
    return fromExtras;
  }
  const name = [user.spec?.firstName, user.spec?.lastName].filter(Boolean).join(' ');
  if (name) {
    return name;
  }
  return user.spec?.username || user.metadata?.name || user.id;
};

export const readUserEmail = (user: User): string | undefined => {
  return user.spec?.email || readStr(asRecord(user), 'email');
};

export const readUserRole = (user: User): string | undefined => {
  return readStr(asRecord(user), 'role');
};

export const readUserStatus = (user: User): string | undefined => {
  return user.status?.phase || readStr(asRecord(user), 'status');
};

export const readUserLastLogin = (user: User): string | undefined => {
  return readStr(asRecord(user), 'last_login', 'lastLogin');
};

export const readOrganizationDisplayName = (org: Organization): string => {
  return readStr(asRecord(org), 'display_name', 'displayName') ?? org.metadata?.name ?? org.id;
};

export const readOrganizationDescription = (org: Organization): string | undefined => {
  return readStr(asRecord(org), 'description');
};

export const readOrganizationStatus = (org: Organization): string | undefined => {
  return readStr(asRecord(org), 'status');
};

export const readOrganizationVmCount = (org: Organization): number | undefined => {
  const o = asRecord(org);
  const vmCount = o.vm_count ?? o.vmCount;
  return typeof vmCount === 'number' ? vmCount : undefined;
};
