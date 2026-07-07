import { useMutation } from '@tanstack/react-query';

import {
  type NetworkClass,
  type NetworkClassesListResponse,
  NetworkClassesListResponseSchema,
  type SecurityGroup,
  SecurityGroupSchema,
  SecurityGroupState,
  type SecurityGroupsListResponse,
  SecurityGroupsListResponseSchema,
  type Subnet,
  SubnetSchema,
  SubnetState,
  type SubnetsListResponse,
  SubnetsListResponseSchema,
  type VirtualNetwork,
  VirtualNetworkSchema,
  VirtualNetworkState,
  type VirtualNetworksListResponse,
  VirtualNetworksListResponseSchema,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { apiQueryKey } from '../types';
import { useApiQuery, useApiQueryClient } from '../use-api-query';

export type ListNetworkingParams = {
  filter?: string;
  limit?: number;
  offset?: number;
  order?: string;
};

type NetworkingQueryOptions = {
  enabled?: boolean;
};

export const useNetworkClasses = (
  params: ListNetworkingParams = {},
  options: NetworkingQueryOptions = {},
) =>
  useApiQuery<NetworkClassesListResponse, NetworkClass[]>({
    queryKey: ['v1/network_classes', null, params],
    select: (data) => data.items,
    meta: { decode: NetworkClassesListResponseSchema },
    enabled: options.enabled ?? true,
  });

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
  virtualNetworkScopeFilter(virtualNetworkId);

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

export const useVirtualNetwork = (id: string) =>
  useApiQuery<VirtualNetwork>({
    queryKey: ['v1/virtual_networks', [id]],
    meta: { decode: VirtualNetworkSchema },
    enabled: Boolean(id),
  });

export const useSubnet = (id: string) =>
  useApiQuery<Subnet>({
    queryKey: ['v1/subnets', [id]],
    meta: { decode: SubnetSchema },
    enabled: Boolean(id),
  });

export const useSecurityGroup = (id: string) =>
  useApiQuery<SecurityGroup>({
    queryKey: ['v1/security_groups', [id]],
    meta: { decode: SecurityGroupSchema },
    enabled: Boolean(id),
  });

export const invalidateVirtualNetworksQueries = (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/virtual_networks') });

export const invalidateSubnetsQueries = (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/subnets') });

export const invalidateSecurityGroupsQueries = (qc: ReturnType<typeof useApiQueryClient>) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/security_groups') });

export interface VirtualNetworkInput {
  name: string;
  network_class: string;
  ipv4_cidr?: string;
  ipv6_cidr?: string;
}

export interface SubnetInput {
  name: string;
  virtual_network: string;
  ipv4_cidr?: string;
  ipv6_cidr?: string;
}

export const useCreateVirtualNetwork = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: VirtualNetworkInput): Promise<VirtualNetwork> => {
      const vn = await apiFetch<VirtualNetwork>('v1/virtual_networks', {
        method: 'POST',
        body: {
          metadata: { name: input.name },
          spec: {
            networkClass: input.network_class,
            ...(input.ipv4_cidr && { ipv4Cidr: input.ipv4_cidr }),
            ...(input.ipv6_cidr && { ipv6Cidr: input.ipv6_cidr }),
            capabilities: {
              enableIpv4: Boolean(input.ipv4_cidr),
              enableIpv6: Boolean(input.ipv6_cidr),
              enableDualStack: Boolean(input.ipv4_cidr && input.ipv6_cidr),
            },
          },
        },
        decode: VirtualNetworkSchema,
      });
      if (!vn.id) {
        throw new Error('Create response missing id');
      }
      return vn;
    },
    onSuccess: () => invalidateVirtualNetworksQueries(qc),
  });
};

export const useDeleteVirtualNetwork = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/virtual_networks', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateVirtualNetworksQueries(qc),
  });
};

export const useCreateSubnet = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: SubnetInput): Promise<Subnet> => {
      const subnet = await apiFetch<Subnet>('v1/subnets', {
        method: 'POST',
        body: {
          metadata: { name: input.name },
          spec: {
            virtualNetwork: input.virtual_network,
            ...(input.ipv4_cidr && { ipv4Cidr: input.ipv4_cidr }),
            ...(input.ipv6_cidr && { ipv6Cidr: input.ipv6_cidr }),
          },
        },
        decode: SubnetSchema,
      });
      if (!subnet.id) {
        throw new Error('Create response missing id');
      }
      return subnet;
    },
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};

export const useDeleteSubnet = () => {
  const apiFetch = useApiFetch();
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<void>('v1/subnets', {
        pathParams: [id],
        method: 'DELETE',
      }),
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};
