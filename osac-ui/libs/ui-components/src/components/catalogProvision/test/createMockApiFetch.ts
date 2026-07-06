import type { ComputeInstanceCatalogItem } from '@osac/types';
import {
  ComputeInstanceCatalogItemsListResponseSchema,
  InstanceTypeState,
  InstanceTypesListResponseSchema,
  SecurityGroupsListResponseSchema,
  SubnetsListResponseSchema,
  VirtualNetworkState,
  VirtualNetworksListResponseSchema,
} from '@osac/types';

import {
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
  const virtualNetworks = fixtures.virtualNetworks ?? [mockVirtualNetwork];
  const subnets = fixtures.subnets ?? [mockSubnet];
  const securityGroups = fixtures.securityGroups ?? [mockSecurityGroup];
  const instanceTypes = fixtures.instanceTypes ?? [mockInstanceType];

  return async (route, options = {}) => {
    const { decode, queryParams } = options;
    const filter = typeof queryParams?.filter === 'string' ? queryParams.filter : undefined;

    switch (route) {
      case 'v1/compute_instance_catalog_items':
        return decodeRoute(
          route,
          { items: catalogItems },
          decode ?? ComputeInstanceCatalogItemsListResponseSchema,
        );
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
