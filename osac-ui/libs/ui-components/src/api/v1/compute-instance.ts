import { ComputeInstance, ComputeInstancesListResponse } from '@osac/types';
import { useApiQuery } from '../use-api-query';

export type ListComputeInstancesParams = {
  filter?: string;
  limit?: number;
  offset?: number;
};

export const useComputeInstances = (params: ListComputeInstancesParams = {}) => {
  return useApiQuery<ComputeInstancesListResponse, ComputeInstance[]>({
    queryKey: ['v1/compute_instances', null, params],
    select: (data) => data.items,
  });
};

export const useComputeInstance = (id: string) => {
  return useApiQuery<ComputeInstance>({
    queryKey: ['v1/compute_instance', [id]],
  });
};
