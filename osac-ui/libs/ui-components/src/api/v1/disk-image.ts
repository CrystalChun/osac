import { type MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import { DiskImageLifecycle, DiskImageSchema, DiskImages } from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';
import { buildUpdateMaskPaths } from './update-mask';

type DiskImagesQueryOptions = {
  enabled?: boolean;
};

export const DISK_IMAGE_NON_OBSOLETE_FILTER = `this.spec.lifecycle != ${DiskImageLifecycle.OBSOLETE}`;

const withDefaultLifecycleFilter = (filter?: string): string | undefined => {
  if (filter?.includes('this.spec.lifecycle')) {
    return filter;
  }
  return filter
    ? `(${filter}) && ${DISK_IMAGE_NON_OBSOLETE_FILTER}`
    : DISK_IMAGE_NON_OBSOLETE_FILTER;
};

export const useDiskImages = (params: ListParams = {}, options: DiskImagesQueryOptions = {}) => {
  const client = useApiFetch(DiskImages);
  const effectiveParams = { ...params, filter: withDefaultLifecycleFilter(params.filter) };
  return useApiQuery({
    queryKey: apiQueryKey('v1/disk_images', undefined, effectiveParams),
    queryFn: () => client.list(effectiveParams),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const useDiskImage = (id?: string) => {
  const client = useApiFetch(DiskImages);
  return useApiQuery({
    queryKey: apiQueryKey('v1/disk_images', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: !!id,
  });
};

export const invalidateDiskImagesQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/disk_images') });

export const useCreateDiskImage = () => {
  const client = useApiFetch(DiskImages);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof DiskImageSchema>) => {
      const resp = await client.create({ object: body });
      if (!resp.object) {
        throw new Error('Create response missing disk image object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateDiskImagesQueries(qc),
  });
};

export type UpdateDiskImageInput = {
  id: string;
  body: MessageInitShape<typeof DiskImageSchema>;
};

export const useUpdateDiskImage = () => {
  const client = useApiFetch(DiskImages);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: UpdateDiskImageInput) => {
      const resp = await client.update({
        object: { id, ...body },
        updateMask: { paths: buildUpdateMaskPaths(body as Record<string, unknown>) },
      });
      if (!resp.object) {
        throw new Error('Update response missing object');
      }
      return resp.object;
    },
    onSuccess: () => invalidateDiskImagesQueries(qc),
  });
};

export const useDeleteDiskImage = () => {
  const client = useApiFetch(DiskImages);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateDiskImagesQueries(qc),
  });
};
