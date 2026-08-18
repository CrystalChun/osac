import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { type ProjectSchema, Projects } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

const invalidateProjectQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/projects') });

export const useProjects = (
  params: ListParams = {
    filter: 'this.metadata.tenant != "shared"',
  },
) => {
  const client = useApiFetch(Projects);
  return useApiQuery({
    queryKey: apiQueryKey('v1/projects', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
  });
};

export const useProject = (id?: string) => {
  const client = useApiFetch(Projects);
  return useApiQuery({
    queryKey: apiQueryKey('v1/projects', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => {
      if (!data.object) {
        throw new Error('Get response missing project object');
      }
      return data.object;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const client = useApiFetch(Projects);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof ProjectSchema>) => {
      const resp = await client.create({ object: body });
      if (!resp.object) {
        throw new Error('Create response missing project object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateProjectQueries(qc),
  });
};

export const useDeleteProject = () => {
  const client = useApiFetch(Projects);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateProjectQueries(qc),
  });
};
