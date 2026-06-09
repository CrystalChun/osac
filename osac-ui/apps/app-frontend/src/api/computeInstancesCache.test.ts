import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import type { ComputeInstance, PageOfT } from '@osac/api-contracts';
import {
  removeComputeInstanceFromCache,
  upsertComputeInstanceInCache,
} from './computeInstancesCache';

const vm = (id: string, state: ComputeInstance['status']['state']): ComputeInstance => {
  return { id, metadata: { name: id }, spec: {}, status: { state } };
};

const seed = (qc: QueryClient, items: ComputeInstance[]) => {
  const page: PageOfT<ComputeInstance> = { size: items.length, total: items.length, items };
  qc.setQueryData(['compute_instances', {}], page);
};

describe('computeInstancesCache', () => {
  it('upserts an instance in all compute_instances queries', () => {
    const qc = new QueryClient();
    seed(qc, [vm('a', 'running')]);

    upsertComputeInstanceInCache(qc, vm('a', 'stopped'));

    const page = qc.getQueryData<PageOfT<ComputeInstance>>(['compute_instances', {}]);
    expect(page?.items[0]?.status.state).toBe('stopped');
  });

  it('removes an instance from cache', () => {
    const qc = new QueryClient();
    seed(qc, [vm('a', 'running'), vm('b', 'stopped')]);

    removeComputeInstanceFromCache(qc, 'a');

    const page = qc.getQueryData<PageOfT<ComputeInstance>>(['compute_instances', {}]);
    expect(page?.items.map((v) => v.id)).toEqual(['b']);
  });
});
