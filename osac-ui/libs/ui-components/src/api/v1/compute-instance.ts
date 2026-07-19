import { type MessageInitShape } from '@bufbuild/protobuf';
import { timestampNow } from '@bufbuild/protobuf/wkt';
import { useMutation } from '@tanstack/react-query';

import {
  type ComputeInstance,
  ComputeInstanceSchema,
  ComputeInstanceState,
  ComputeInstances,
  type ComputeInstancesGetResponse,
  type ComputeInstancesListResponse,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

export const POWER_ACTION_POLL_MS = 2000;

export const isTransitionalComputeInstanceState = (state?: ComputeInstanceState): boolean =>
  state === ComputeInstanceState.STARTING ||
  state === ComputeInstanceState.STOPPING ||
  state === ComputeInstanceState.DELETING;

export const useComputeInstances = (params: ListParams = {}) => {
  const client = useApiFetch(ComputeInstances);
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instances', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    refetchInterval: (query) => {
      const items = query.state.data?.items;
      if (items?.some((item) => isTransitionalComputeInstanceState(item.status?.state))) {
        return POWER_ACTION_POLL_MS;
      }
      return false;
    },
  });
};

export const useComputeInstance = (id: string) => {
  const client = useApiFetch(ComputeInstances);
  const trimmedId = id?.trim() ?? '';
  return useApiQuery({
    queryKey: apiQueryKey('v1/compute_instances', [trimmedId]),
    queryFn: () => client.get({ id: trimmedId }),
    select: (data) => data.object,
    enabled: Boolean(trimmedId),
    refetchInterval: (query) => {
      const instance = query.state.data?.object;
      if (instance && isTransitionalComputeInstanceState(instance.status?.state)) {
        return POWER_ACTION_POLL_MS;
      }
      return false;
    },
  });
};

export const invalidateComputeInstancesQueries = async (qc: ApiQueryClient) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/compute_instances') });
};

export const POST_CREATE_LIST_POLL_MS = 500;
export const POST_CREATE_LIST_POLL_MAX_ATTEMPTS = 20;

export const pollComputeInstancesUntilListed = async (
  qc: ApiQueryClient,
  instanceId: string,
  signal?: { cancelled: boolean },
): Promise<void> => {
  for (let attempt = 0; attempt < POST_CREATE_LIST_POLL_MAX_ATTEMPTS; attempt++) {
    if (signal?.cancelled) {
      return;
    }
    await invalidateComputeInstancesQueries(qc);
    const data = qc.getQueryData<ComputeInstancesListResponse>(apiQueryKey('v1/compute_instances'));
    if (data?.items?.some((v) => v.id === instanceId)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, POST_CREATE_LIST_POLL_MS));
  }
};

export const useProvisionComputeInstance = () => {
  const client = useApiFetch(ComputeInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (vm: MessageInitShape<typeof ComputeInstanceSchema>) =>
      client.create({ object: vm }).then((r) => r.object),
    onSuccess: async () => {
      await invalidateComputeInstancesQueries(qc);
    },
  });
};

export type ComputeInstancePowerAction = 'start' | 'stop' | 'restart';

export type PatchComputeInstanceInput = {
  id: string;
  powerAction: ComputeInstancePowerAction;
};

const buildPowerPatchBody = (
  powerAction: ComputeInstancePowerAction,
): MessageInitShape<typeof ComputeInstanceSchema> => {
  switch (powerAction) {
    case 'stop':
      return {
        spec: { runStrategy: 'Halted' },
        status: { state: ComputeInstanceState.STOPPED },
      };
    case 'start':
      return {
        spec: { runStrategy: 'Always' },
        status: { state: ComputeInstanceState.RUNNING },
      };
    case 'restart':
      return { spec: { restartRequestedAt: timestampNow() } };
  }
};

export const powerActionToTransitionalState = (
  powerAction: ComputeInstancePowerAction,
): ComputeInstanceState => {
  switch (powerAction) {
    case 'start':
    case 'restart':
      return ComputeInstanceState.STARTING;
    case 'stop':
      return ComputeInstanceState.STOPPING;
  }
};

const applyTransitionalState = (vm: ComputeInstance, state: ComputeInstanceState) => {
  if (!vm.status) {
    return vm;
  }
  return { ...vm, status: { ...vm.status, state } } as ComputeInstance;
};

export const usePatchComputeInstance = () => {
  const client = useApiFetch(ComputeInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: ({ id, powerAction }: PatchComputeInstanceInput) =>
      client.update({ object: { id, ...buildPowerPatchBody(powerAction) } }).then((r) => r.object),
    onMutate: async ({ id, powerAction }) => {
      await qc.cancelQueries({ queryKey: apiQueryKey('v1/compute_instances') });
      const transitionalState = powerActionToTransitionalState(powerAction);

      const detailKey = apiQueryKey('v1/compute_instances', [id]);
      const previousDetail = qc.getQueryData<ComputeInstancesGetResponse>(detailKey);
      const previousList = qc.getQueriesData<ComputeInstancesListResponse>({
        queryKey: apiQueryKey('v1/compute_instances'),
      });

      qc.setQueryData<ComputeInstancesGetResponse>(detailKey, (old) => {
        if (!old?.object) {
          return old;
        }
        return { ...old, object: applyTransitionalState(old.object, transitionalState) };
      });

      qc.setQueriesData<ComputeInstancesListResponse>(
        { queryKey: apiQueryKey('v1/compute_instances') },
        (old) => {
          if (!old?.items) {
            return old;
          }
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === id ? applyTransitionalState(item, transitionalState) : item,
            ),
          };
        },
      );

      return { previousDetail, previousList, detailKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousDetail) {
        qc.setQueryData(context.detailKey, context.previousDetail);
      }
      if (context?.previousList) {
        for (const [key, data] of context.previousList) {
          qc.setQueryData(key, data);
        }
      }
    },
    onSettled: () => invalidateComputeInstancesQueries(qc),
  });
};

export const useDeleteComputeInstance = () => {
  const client = useApiFetch(ComputeInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateComputeInstancesQueries(qc),
  });
};
