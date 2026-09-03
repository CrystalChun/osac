import { MessageInitShape } from '@bufbuild/protobuf';
import { useMutation } from '@tanstack/react-query';

import {
  type SecurityGroup,
  SecurityGroupSchema,
  SecurityGroupState,
  SecurityGroups,
  type Subnet,
  SubnetSchema,
  SubnetState,
  Subnets,
  type VirtualNetwork,
  VirtualNetworkSchema,
  VirtualNetworkState,
  VirtualNetworks,
} from '@osac/types';

import { useApiFetch } from '../api-context';
import { cel } from '../cel';
import { type ListParams, apiQueryKey } from '../types';
import { type ApiQueryClient, useApiQuery, useApiQueryClient } from '../use-api-query';

type NetworkingQueryOptions = {
  enabled?: boolean;
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

// Scope + ready filter: use where only attachable subnets are valid (e.g. the VM
// provisioning wizard). Not for the detail page — it hides non-ready subnets.
export const virtualNetworkFilterForSubnetList = (virtualNetworkId: string) =>
  cel<Subnet>((filter) =>
    filter.and(
      filter.field('spec.virtualNetwork.id').equals(virtualNetworkId),
      filter.field('status.state').equals(SubnetState.READY),
    ),
  );

export const securityGroupFilterForVirtualNetworkList = (virtualNetworkId: string) =>
  cel<SecurityGroup>((filter) =>
    filter.and(
      filter.field('spec.virtualNetwork.id').equals(virtualNetworkId),
      filter.field('status.state').equals(SecurityGroupState.READY),
    ),
  );

export const VIRTUAL_NETWORK_READY_LIST_FILTER = cel<VirtualNetwork>((filter) =>
  filter.field('status.state').equals(VirtualNetworkState.READY),
);

export const virtualNetworkScopeFilter = (virtualNetworkId: string) =>
  cel<Subnet>((filter) => filter.field('spec.virtualNetwork.id').equals(virtualNetworkId));

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

export const useCreateVirtualNetwork = () => {
  const client = useApiFetch(VirtualNetworks);
  const qc = useApiQueryClient();
  return useMutation({
    mutationFn: async (input: MessageInitShape<typeof VirtualNetworkSchema>) => {
      const resp = await client.create({
        object: input,
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
    mutationFn: async (input: MessageInitShape<typeof SubnetSchema>) => {
      const resp = await client.create({
        object: input,
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

export const securityGroupFilterForVirtualNetwork = (virtualNetworkId: string) =>
  cel<SecurityGroup>((filter) => filter.field('spec.virtualNetwork.id').equals(virtualNetworkId));

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
