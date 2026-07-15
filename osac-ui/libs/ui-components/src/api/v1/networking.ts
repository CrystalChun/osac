import { MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  NetworkClasses,
  SecurityGroupSchema,
  SecurityGroupState,
  SecurityGroups,
  SubnetState,
  Subnets,
  VirtualNetworkState,
  VirtualNetworks,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

type NetworkingQueryOptions = {
  enabled?: boolean;
};

export const useNetworkClasses = (
  params: ListParams = {},
  options: NetworkingQueryOptions = {},
) => {
  const client = useApiFetch(NetworkClasses);
  return useApiQuery({
    queryKey: apiQueryKey('v1/network_classes', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const useVirtualNetworks = (
  params: ListParams = {},
  options: NetworkingQueryOptions = {},
) => {
  const client = useApiFetch(VirtualNetworks);
  return useApiQuery({
    queryKey: apiQueryKey('v1/virtual_networks', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const useSubnets = (params: ListParams = {}, options: NetworkingQueryOptions = {}) => {
  const client = useApiFetch(Subnets);
  return useApiQuery({
    queryKey: apiQueryKey('v1/subnets', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const useSecurityGroups = (
  params: ListParams = {},
  options: NetworkingQueryOptions = {},
) => {
  const client = useApiFetch(SecurityGroups);
  return useApiQuery({
    queryKey: apiQueryKey('v1/security_groups', undefined, params),
    queryFn: () => client.list(params),
    select: (data) => data.items,
    enabled: options.enabled ?? true,
  });
};

export const virtualNetworkFilterForSubnetList = (virtualNetworkId: string): string =>
  combineListFilters(virtualNetworkScopeFilter(virtualNetworkId), SUBNET_READY_LIST_FILTER);

export const securityGroupFilterForVirtualNetworkList = (virtualNetworkId: string): string =>
  combineListFilters(virtualNetworkScopeFilter(virtualNetworkId), SECURITY_GROUP_READY_LIST_FILTER);

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

export const escapeCelStringLiteral = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');

const virtualNetworkScopeFilter = (virtualNetworkId: string): string =>
  `this.spec.virtual_network == "${escapeCelStringLiteral(virtualNetworkId)}"`;

export const resourceDisplayName = (metadata?: { name?: string }, id?: string): string =>
  metadata?.name?.trim() || id || '—';

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
): string => formatResourceIdsForReview(id ? [id] : [], resources);

export const useVirtualNetwork = (id: string) => {
  const client = useApiFetch(VirtualNetworks);
  return useApiQuery({
    queryKey: apiQueryKey('v1/virtual_networks', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const useSubnet = (id: string) => {
  const client = useApiFetch(Subnets);
  return useApiQuery({
    queryKey: apiQueryKey('v1/subnets', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const useSecurityGroup = (id: string) => {
  const client = useApiFetch(SecurityGroups);
  return useApiQuery({
    queryKey: apiQueryKey('v1/security_groups', [id]),
    queryFn: () => client.get({ id }),
    select: (data) => data.object,
    enabled: Boolean(id),
  });
};

export const invalidateVirtualNetworksQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/virtual_networks') });

export const invalidateSubnetsQueries = (qc: ApiQueryClient) =>
  qc.invalidateQueries({ queryKey: apiQueryKey('v1/subnets') });

export const invalidateSecurityGroupsQueries = (qc: ApiQueryClient) =>
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
  const client = useApiFetch(VirtualNetworks);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: VirtualNetworkInput) => {
      const resp = await client.create({
        object: {
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
      });
      const vn = resp.object;
      if (!vn?.id) {
        throw new Error('Create response missing id');
      }
      return vn;
    },
    onSuccess: () => invalidateVirtualNetworksQueries(qc),
  });
};

export const useDeleteVirtualNetwork = () => {
  const client = useApiFetch(VirtualNetworks);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateVirtualNetworksQueries(qc),
  });
};

export const useCreateSubnet = () => {
  const client = useApiFetch(Subnets);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: SubnetInput) => {
      const resp = await client.create({
        object: {
          metadata: { name: input.name },
          spec: {
            virtualNetwork: input.virtual_network,
            ...(input.ipv4_cidr && { ipv4Cidr: input.ipv4_cidr }),
            ...(input.ipv6_cidr && { ipv6Cidr: input.ipv6_cidr }),
          },
        },
      });
      const subnet = resp.object;
      if (!subnet?.id) {
        throw new Error('Create response missing id');
      }
      return subnet;
    },
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};

export const useDeleteSubnet = () => {
  const client = useApiFetch(Subnets);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateSubnetsQueries(qc),
  });
};

export const securityGroupFilterForVirtualNetwork = (virtualNetworkId: string): string =>
  `this.spec.virtual_network == "${escapeCelStringLiteral(virtualNetworkId)}"`;

export const useCreateSecurityGroup = () => {
  const client = useApiFetch(SecurityGroups);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (body: MessageInitShape<typeof SecurityGroupSchema>) => {
      const resp = await client.create({ object: body });
      const sg = resp.object;
      if (!sg?.id) {
        throw new Error('Create response missing id');
      }
      return sg;
    },
    onSuccess: () => invalidateSecurityGroupsQueries(qc),
  });
};

export const useUpdateSecurityGroup = () => {
  const client = useApiFetch(SecurityGroups);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async ({ object }: { object: MessageInitShape<typeof SecurityGroupSchema> }) => {
      const resp = await client.update({ object });
      return resp.object;
    },
    onSuccess: () => invalidateSecurityGroupsQueries(qc),
  });
};

export const useDeleteSecurityGroup = () => {
  const client = useApiFetch(SecurityGroups);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: (id: string) => client.delete({ id }),
    onSuccess: () => invalidateSecurityGroupsQueries(qc),
  });
};
