/**
 * Keep React Query compute_instances cache aligned with mutation responses so navigation
 * back to My VMs does not show a pre-action list while data is still "fresh".
 */
import type { QueryClient } from '@tanstack/react-query';
import type { ComputeInstance, PageOfT } from '@osac/api-contracts/types';

const patchPage = (
  old: PageOfT<ComputeInstance> | undefined,
  items: ComputeInstance[],
): PageOfT<ComputeInstance> | undefined => {
  if (!old) {
    return old;
  }
  return { ...old, items, size: items.length };
};

export const upsertComputeInstanceInCache = (qc: QueryClient, updated: ComputeInstance): void => {
  qc.setQueriesData<PageOfT<ComputeInstance>>({ queryKey: ['compute_instances'] }, (old) => {
    if (!old?.items) {
      return old;
    }
    const idx = old.items.findIndex((v) => v.id === updated.id);
    if (idx < 0) {
      return old;
    }
    const items = [...old.items];
    items[idx] = updated;
    return patchPage(old, items);
  });
};

export const removeComputeInstanceFromCache = (qc: QueryClient, id: string): void => {
  qc.setQueriesData<PageOfT<ComputeInstance>>({ queryKey: ['compute_instances'] }, (old) => {
    if (!old?.items) {
      return old;
    }
    const items = old.items.filter((v) => v.id !== id);
    if (items.length === old.items.length) {
      return old;
    }
    return patchPage(old, items);
  });
};

export const appendComputeInstanceToCache = (qc: QueryClient, created: ComputeInstance): void => {
  qc.setQueriesData<PageOfT<ComputeInstance>>({ queryKey: ['compute_instances'] }, (old) => {
    if (!old?.items) {
      return old;
    }
    if (old.items.some((v) => v.id === created.id)) {
      return patchPage(
        old,
        old.items.map((v) => (v.id === created.id ? created : v)),
      );
    }
    return patchPage(old, [...old.items, created]);
  });
};
