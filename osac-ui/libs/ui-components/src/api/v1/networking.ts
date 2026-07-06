import {
  type SecurityGroup,
  SecurityGroupState,
  type SecurityGroupsListResponse,
  SecurityGroupsListResponseSchema,
  type Subnet,
  SubnetState,
  type SubnetsListResponse,
  SubnetsListResponseSchema,
  type VirtualNetwork,
  VirtualNetworkState,
  type VirtualNetworksListResponse,
  VirtualNetworksListResponseSchema,
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
  combineListFilters(virtualNetworkScopeFilter(virtualNetworkId), SUBNET_READY_LIST_FILTER);

export const securityGroupFilterForVirtualNetworkList = (virtualNetworkId: string): string =>
  combineListFilters(virtualNetworkScopeFilter(virtualNetworkId), SECURITY_GROUP_READY_LIST_FILTER);

/** CEL list filters compare enum fields to integer literals (see fulfillment-service docs/FILTER.md). */
const readyStateFilter = (readyState: number): string => `this.status.state == ${readyState}`;

export const VIRTUAL_NETWORK_READY_LIST_FILTER = readyStateFilter(VirtualNetworkState.READY);

export const SUBNET_READY_LIST_FILTER = readyStateFilter(SubnetState.READY);

export const SECURITY_GROUP_READY_LIST_FILTER = readyStateFilter(SecurityGroupState.READY);

const combineListFilters = (...parts: string[]): string => {
  if (parts.length === 1) {
    return parts[0];
  }
  return parts.map((part) => `(${part})`).join(' && ');
};

/** Escape a value for interpolation inside a CEL double-quoted string literal. */
export const escapeCelStringLiteral = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const virtualNetworkScopeFilter = (virtualNetworkId: string): string =>
  `this.spec.virtual_network == "${escapeCelStringLiteral(virtualNetworkId)}"`;

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
