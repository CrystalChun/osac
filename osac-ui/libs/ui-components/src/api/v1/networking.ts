import {
  type SecurityGroup,
  SecurityGroupsListResponseSchema,
  type SecurityGroupsListResponse,
  type Subnet,
  SubnetsListResponseSchema,
  type SubnetsListResponse,
  type VirtualNetwork,
  VirtualNetworksListResponseSchema,
  type VirtualNetworksListResponse,
} from '@osac/types';

import { useApiQuery } from '../use-api-query';

export type ListNetworkingParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

type NetworkingQueryOptions = {
  enabled?: boolean;
};

export const useVirtualNetworks = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<VirtualNetworksListResponse, VirtualNetwork[]>({
    queryKey: ['v1/virtual_networks', null, params],
    select: (data) => data.items,
    meta: { decode: VirtualNetworksListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const useSubnets = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<SubnetsListResponse, Subnet[]>({
    queryKey: ['v1/subnets', null, params],
    select: (data) => data.items,
    meta: { decode: SubnetsListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const useSecurityGroups = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<SecurityGroupsListResponse, SecurityGroup[]>({
    queryKey: ['v1/security_groups', null, params],
    select: (data) => data.items,
    meta: { decode: SecurityGroupsListResponseSchema },
    enabled: options.enabled ?? true,
  });

export const virtualNetworkFilterForSubnetList = (virtualNetworkId: string): string =>
  `this.spec.virtual_network == "${virtualNetworkId}"`;

export const resourceDisplayName = (metadata?: { name?: string }, id?: string): string =>
  metadata?.name?.trim() || id?.trim() || '—';

export const formatResourceIdsForReview = (
  ids: string[],
  resources: Array<{ id: string; metadata?: { name?: string } }>,
): string => {
  if (ids.length === 0) {
    return '—';
  }

  return ids
    .map((id) => {
      const resource = resources.find((item) => item.id === id);
      return resourceDisplayName(resource?.metadata, id);
    })
    .join(', ');
};

export const formatResourceIdForReview = (
  id: string,
  resources: Array<{ id: string; metadata?: { name?: string } }>,
): string => formatResourceIdsForReview(id.trim() ? [id] : [], resources);
