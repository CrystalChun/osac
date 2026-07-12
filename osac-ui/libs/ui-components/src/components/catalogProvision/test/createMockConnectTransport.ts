import { Code, ConnectError, type Transport, createRouterTransport } from '@connectrpc/connect';

import {
  ClusterCatalogItem,
  ClusterCatalogItems,
  ClusterTemplates,
  Clusters,
  ComputeInstanceCatalogItem,
  ComputeInstanceCatalogItems,
  HostTypes,
  InstanceTypeState,
  InstanceTypes,
  SecurityGroups,
  Subnets,
  VirtualNetworkState,
  VirtualNetworks,
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
import { UnauthorizedError } from '../../../utils/unauthorizedError';

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

export const wrapWithAuthInterceptor = (transport: Transport): Transport => ({
  ...transport,
  unary: async (...args: Parameters<Transport['unary']>) => {
    try {
      return await transport.unary(...args);
    } catch (err) {
      if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
        throw new UnauthorizedError();
      }
      throw err;
    }
  },
});

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

const matchesInstanceTypeActiveFilter = (
  filter: string | undefined,
  state: number | undefined,
): boolean => {
  if (!filter?.includes('this.spec.state ==')) {
    return true;
  }
  return state === InstanceTypeState.ACTIVE;
};

export type MockTransportOverrides = {
  onClusterCreate?: (req: { object?: unknown }) => unknown;
};

export const createMockConnectTransport = (
  fixtures: WizardApiFixtures = {},
  overrides: MockTransportOverrides = {},
) => {
  const catalogItems = fixtures.catalogItems ?? [vmCatalogItem];
  const clusterCatalogItems = fixtures.clusterCatalogItems ?? [clusterCatalogItem];
  const clusterTemplates = fixtures.clusterTemplates ?? {
    [clusterCatalogItem.template]: mockClusterTemplate,
  };
  const hostTypesMap = fixtures.hostTypes ?? {
    [mockHostType.id]: mockHostType,
    [mockHostTypeH100.id]: mockHostTypeH100,
  };
  const virtualNetworks = fixtures.virtualNetworks ?? [mockVirtualNetwork];
  const subnets = fixtures.subnets ?? [mockSubnet];
  const securityGroups = fixtures.securityGroups ?? [mockSecurityGroup];
  const instanceTypes = fixtures.instanceTypes ?? [mockInstanceType];

  return wrapWithAuthInterceptor(
    createRouterTransport((router) => {
      router.service(ComputeInstanceCatalogItems, {
        list: () => ({ items: catalogItems }),
        get: (req) => ({
          object: catalogItems.find((i) => i.id === req.id),
        }),
      });

      router.service(ClusterCatalogItems, {
        list: () => ({ items: clusterCatalogItems }),
        get: (req) => ({
          object: clusterCatalogItems.find((i) => i.id === req.id),
        }),
      });

      router.service(ClusterTemplates, {
        get: (req) => {
          const template = clusterTemplates[req.id];
          if (!template) {
            throw new ConnectError(`Cluster template not found in test: ${req.id}`, Code.NotFound);
          }
          return template;
        },
      });

      router.service(HostTypes, {
        list: () => ({
          items: Object.values(hostTypesMap),
          size: Object.keys(hostTypesMap).length,
          total: Object.keys(hostTypesMap).length,
        }),
        get: (req) => {
          const hostType = hostTypesMap[req.id];
          if (!hostType) {
            throw new ConnectError(`Host type not found in test: ${req.id}`, Code.NotFound);
          }
          return hostType;
        },
      });

      router.service(VirtualNetworks, {
        list: (req) => ({
          items: virtualNetworks.filter(
            (item) =>
              matchesReadyStateFilter(req.filter, item.status?.state) &&
              matchesVirtualNetworkScopeFilter(req.filter, undefined),
          ),
        }),
      });

      router.service(Subnets, {
        list: (req) => ({
          items: subnets.filter(
            (item) =>
              matchesReadyStateFilter(req.filter, item.status?.state) &&
              matchesVirtualNetworkScopeFilter(req.filter, item.spec?.virtualNetwork),
          ),
        }),
      });

      router.service(SecurityGroups, {
        list: (req) => ({
          items: securityGroups.filter(
            (item) =>
              matchesReadyStateFilter(req.filter, item.status?.state) &&
              matchesVirtualNetworkScopeFilter(req.filter, item.spec?.virtualNetwork),
          ),
        }),
      });

      router.service(InstanceTypes, {
        list: (req) => ({
          items: instanceTypes.filter((item) =>
            matchesInstanceTypeActiveFilter(req.filter, item.spec?.state),
          ),
        }),
      });

      router.service(Clusters, {
        create: (req) => {
          if (overrides.onClusterCreate) {
            return { object: overrides.onClusterCreate(req) };
          }
          return { object: { id: 'cluster-1', ...req.object } };
        },
      });
    }),
  );
};
