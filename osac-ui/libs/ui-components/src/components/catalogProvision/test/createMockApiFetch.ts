import type { ClusterCatalogItem, ComputeInstanceCatalogItem } from '@osac/types';
import {
  ClusterCatalogItemsListResponseSchema,
  ClusterTemplateSchema,
  ComputeInstanceCatalogItemsListResponseSchema,
  HostTypeSchema,
  HostTypesListResponseSchema,
  InstanceTypeState,
  InstanceTypesListResponseSchema,
  SecurityGroupsListResponseSchema,
  SubnetsListResponseSchema,
  VirtualNetworkState,
  VirtualNetworksListResponseSchema,
} from '@osac/types';

import {
  clusterCatalogItem,
  mockClusterTemplate,
  mockHostType,
  mockHostTypeH100,
  mockInstanceType,
  mockSecurityGroup,
  mockSubnet,
  mockVirtualNetwork,
  vmCatalogItem,
} from './fixtures';
import { decodeFulfillmentResponse } from '../../../api/fulfillment-decode';
import type { ApiFetch, ApiRoute } from '../../../api/types';

export type WizardApiFixtures = {
  catalogItems?: ComputeInstanceCatalogItem[];
  clusterCatalogItems?: ClusterCatalogItem[];
  clusterTemplates?: Record<string, typeof mockClusterTemplate>;
  hostTypes?: Record<string, typeof mockHostType>;
  virtualNetworks?: (typeof mockVirtualNetwork)[];
  subnets?: (typeof mockSubnet)[];
  securityGroups?: (typeof mockSecurityGroup)[];
  instanceTypes?: (typeof mockInstanceType)[];
};

const decodeRoute = (route: ApiRoute, raw: unknown, decode?: Parameters<ApiFetch>[1]['decode']) => {
  if (!decode) {
    return raw;
  }
  return decodeFulfillmentResponse(decode, raw);
};

const matchesReadyStateFilter = (
  filter: string | undefined,
  state: number | undefined,
): boolean => {
  if (!filter?.includes('this.status.state ==')) {
    return true;
  }
  return state === VirtualNetworkState.READY;
};

const matchesVirtualNetworkScopeFilter = (
  filter: string | undefined,
  virtualNetwork: string | undefined,
): boolean => {
  if (!filter || !virtualNetwork) {
    return true;
  }
  const match = filter.match(/this\.spec\.virtual_network == "([^"]+)"/);
  if (!match) {
    return true;
  }
  return virtualNetwork === match[1];
};

const filterVirtualNetworks = (items: (typeof mockVirtualNetwork)[], filter: string | undefined) =>
  items.filter(
    (item) =>
      matchesReadyStateFilter(filter, item.status?.state) &&
      matchesVirtualNetworkScopeFilter(filter, undefined),
  );

const filterSubnets = (items: (typeof mockSubnet)[], filter: string | undefined) =>
  items.filter(
    (item) =>
      matchesReadyStateFilter(filter, item.status?.state) &&
      matchesVirtualNetworkScopeFilter(filter, item.spec?.virtualNetwork),
  );

const filterSecurityGroups = (items: (typeof mockSecurityGroup)[], filter: string | undefined) =>
  items.filter(
    (item) =>
      matchesReadyStateFilter(filter, item.status?.state) &&
      matchesVirtualNetworkScopeFilter(filter, item.spec?.virtualNetwork),
  );

const matchesInstanceTypeActiveFilter = (
  filter: string | undefined,
  state: number | undefined,
): boolean => {
  if (!filter?.includes('this.spec.state ==')) {
    return true;
  }
  return state === InstanceTypeState.ACTIVE;
};

const filterInstanceTypes = (items: (typeof mockInstanceType)[], filter: string | undefined) =>
  items.filter((item) => matchesInstanceTypeActiveFilter(filter, item.spec?.state));

export const createMockApiFetch = (fixtures: WizardApiFixtures = {}): ApiFetch => {
  const catalogItems = fixtures.catalogItems ?? [vmCatalogItem];
  const clusterCatalogItems = fixtures.clusterCatalogItems ?? [clusterCatalogItem];
  const clusterTemplates = fixtures.clusterTemplates ?? {
    [clusterCatalogItem.template]: mockClusterTemplate,
  };
  const hostTypes = fixtures.hostTypes ?? {
    [mockHostType.id]: mockHostType,
    [mockHostTypeH100.id]: mockHostTypeH100,
  };
  const virtualNetworks = fixtures.virtualNetworks ?? [mockVirtualNetwork];
  const subnets = fixtures.subnets ?? [mockSubnet];
  const securityGroups = fixtures.securityGroups ?? [mockSecurityGroup];
  const instanceTypes = fixtures.instanceTypes ?? [mockInstanceType];

  return async (route, options = {}) => {
    const { decode, pathParams, queryParams } = options;
    const filter = typeof queryParams?.filter === 'string' ? queryParams.filter : undefined;

    switch (route) {
      case 'v1/compute_instance_catalog_items':
        return decodeRoute(
          route,
          { items: catalogItems },
          decode ?? ComputeInstanceCatalogItemsListResponseSchema,
        );
      case 'v1/cluster_catalog_items':
        return decodeRoute(
          route,
          { items: clusterCatalogItems },
          decode ?? ClusterCatalogItemsListResponseSchema,
        );
      case 'v1/cluster_templates': {
        const templateId = pathParams?.[0];
        const template = templateId ? clusterTemplates[templateId] : undefined;
        if (!template) {
          throw new Error(`Cluster template not found in wizard test: ${templateId}`);
        }
        return decodeRoute(route, template, decode ?? ClusterTemplateSchema);
      }
      case 'v1/host_types': {
        const hostTypeId = pathParams?.[0];
        if (!hostTypeId) {
          return decodeRoute(
            route,
            {
              items: Object.values(hostTypes),
              size: Object.keys(hostTypes).length,
              total: Object.keys(hostTypes).length,
            },
            decode ?? HostTypesListResponseSchema,
          );
        }
        const hostType = hostTypes[hostTypeId];
        if (!hostType) {
          throw new Error(`Host type not found in wizard test: ${hostTypeId}`);
        }
        return decodeRoute(route, hostType, decode ?? HostTypeSchema);
      }
      case 'v1/virtual_networks':
        return decodeRoute(
          route,
          { items: filterVirtualNetworks(virtualNetworks, filter) },
          decode ?? VirtualNetworksListResponseSchema,
        );
      case 'v1/subnets':
        return decodeRoute(
          route,
          { items: filterSubnets(subnets, filter) },
          decode ?? SubnetsListResponseSchema,
        );
      case 'v1/security_groups':
        return decodeRoute(
          route,
          { items: filterSecurityGroups(securityGroups, filter) },
          decode ?? SecurityGroupsListResponseSchema,
        );
      case 'v1/instance_types':
        return decodeRoute(
          route,
          { items: filterInstanceTypes(instanceTypes, filter) },
          decode ?? InstanceTypesListResponseSchema,
        );
      default:
        throw new Error(`Unexpected API route in wizard test: ${route}`);
    }
  };
};
