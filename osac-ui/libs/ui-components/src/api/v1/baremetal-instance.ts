import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  BareMetalInstanceCatalogItems,
  BareMetalInstanceRunStrategy,
  BareMetalInstanceSchema,
  BareMetalInstances,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

export const useBareMetalInstances = () => {
  const client = useApiFetch(BareMetalInstances);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instances'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
  });
};

export const useBareMetalInstance = (id: string) => {
  const client = useApiFetch(BareMetalInstances);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instances', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const useBareMetalInstanceCatalogItems = (enabled = true) => {
  const client = useApiFetch(BareMetalInstanceCatalogItems);
  return useApiQuery({
    queryKey: apiQueryKey('v1/baremetal_instance_catalog_items'),
    queryFn: () => client.list({}),
    select: (data) => data.items,
    enabled,
  });
};

export const invalidateBareMetalInstancesQueries = async (qc: ApiQueryClient) => {
  await qc.invalidateQueries({ queryKey: apiQueryKey('v1/baremetal_instances') });
};

export type BareMetalPowerAction = 'start' | 'stop' | 'restart';

export type PatchBareMetalInstanceInput =
  | { id: string; action: 'start' | 'stop' }
  | { id: string; action: 'restart'; currentTrigger: bigint };

const buildPatch = (
  input: PatchBareMetalInstanceInput,
): { body: MessageInitShape<typeof BareMetalInstanceSchema>; maskPaths: string[] } => {
  switch (input.action) {
    case 'start':
      return {
        body: { spec: { runStrategy: BareMetalInstanceRunStrategy.ALWAYS } },
        maskPaths: ['spec.run_strategy'],
      };
    case 'stop':
      return {
        body: { spec: { runStrategy: BareMetalInstanceRunStrategy.HALTED } },
        maskPaths: ['spec.run_strategy'],
      };
    case 'restart':
      return {
        body: { spec: { restartTrigger: input.currentTrigger + 1n } },
        maskPaths: ['spec.restart_trigger'],
      };
  }
};

export const usePatchBareMetalInstance = () => {
  const client = useApiFetch(BareMetalInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (input: PatchBareMetalInstanceInput) => {
      const { body, maskPaths } = buildPatch(input);
      return client
        .update({ object: { id: input.id, ...body }, updateMask: { paths: maskPaths } })
        .then((r) => r.object);
    },
    onSuccess: () => invalidateBareMetalInstancesQueries(qc),
  });
};

export const useDeleteBareMetalInstance = () => {
  const client = useApiFetch(BareMetalInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateBareMetalInstancesQueries(qc),
  });
};

export const useCreateBareMetalInstance = () => {
  const client = useApiFetch(BareMetalInstances);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (bmi: MessageInitShape<typeof BareMetalInstanceSchema>) =>
      client.create({ object: bmi }).then((r) => r.object),
    onSuccess: () => invalidateBareMetalInstancesQueries(qc),
  });
};
