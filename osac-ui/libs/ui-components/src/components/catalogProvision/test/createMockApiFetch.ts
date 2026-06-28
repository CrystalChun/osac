import type { ComputeInstanceCatalogItem } from '@osac/types';
import {
  ComputeInstanceCatalogItemsListResponseSchema,
  InstanceTypesListResponseSchema,
  SecurityGroupsListResponseSchema,
  SubnetsListResponseSchema,
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

export const createMockApiFetch = (fixtures: WizardApiFixtures = {}): ApiFetch => {
  const catalogItems = fixtures.catalogItems ?? [vmCatalogItem];
  const virtualNetworks = fixtures.virtualNetworks ?? [mockVirtualNetwork];
  const subnets = fixtures.subnets ?? [mockSubnet];
  const securityGroups = fixtures.securityGroups ?? [mockSecurityGroup];
  const instanceTypes = fixtures.instanceTypes ?? [mockInstanceType];

  return async (route, options = {}) => {
    const { decode } = options;

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
          { items: virtualNetworks },
          decode ?? VirtualNetworksListResponseSchema,
        );
      case 'v1/subnets':
        return decodeRoute(route, { items: subnets }, decode ?? SubnetsListResponseSchema);
      case 'v1/security_groups':
        return decodeRoute(
          route,
          { items: securityGroups },
          decode ?? SecurityGroupsListResponseSchema,
        );
      case 'v1/instance_types':
        return decodeRoute(
          route,
          { items: instanceTypes },
          decode ?? InstanceTypesListResponseSchema,
        );
      default:
        throw new Error(`Unexpected API route in wizard test: ${route}`);
    }
  };
};
