import { type HostType, HostTypeSchema } from '@osac/types';

import { useApiQuery } from '../use-api-query';
import { resourceDisplayName } from './networking';

export const useHostType = (id: string | undefined) => {
  const trimmedId = id?.trim() ?? '';
  return useApiQuery<HostType>({
    queryKey: ['v1/host_types', trimmedId ? [trimmedId] : null],
    meta: { decode: HostTypeSchema },
    enabled: Boolean(trimmedId),
  });
};

export const hostTypeDisplayName = (hostType: HostType): string =>
  hostType.title?.trim() || resourceDisplayName(hostType.metadata, hostType.id);
