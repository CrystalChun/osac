import { Code, ConnectError, type Transport, createRouterTransport } from '@connectrpc/connect';

import type {
  ClusterCatalogItem,
  ClusterTemplate,
  ClustersCreateRequest,
  ClustersCreateResponse,
  ComputeInstanceCatalogItem,
  HostType,
  InstanceType,
  SecurityGroup,
  Subnet,
  VirtualNetwork,
} from '@osac/types';
import {
  ClusterCatalogItems,
  ClusterTemplates,
  Clusters,
  ComputeInstanceCatalogItems,
  HostTypes,
  InstanceTypeState,
  InstanceTypes,
  SecurityGroups,
  Subnets,
  VirtualNetworkState,
  VirtualNetworks,
} from '@osac/types';

import { UnauthorizedError } from '../utils/unauthorizedError';

export type MockApiFixtures = {
  catalogItems?: ComputeInstanceCatalogItem[];
  clusterCatalogItems?: ClusterCatalogItem[];
  clusterTemplates?: ClusterTemplate[];
  hostTypes?: HostType[];
  virtualNetworks?: VirtualNetwork[];
  subnets?: Subnet[];
  securityGroups?: SecurityGroup[];
  instanceTypes?: InstanceType[];
};

export const wrapWithAuthInterceptor = (transport: Transport): Transport => {
  const wrapped: Transport = {
    ...transport,
    unary: async (...args) => {
      try {
        return await transport.unary(...args);
      } catch (err) {
        if (err instanceof ConnectError && err.code === Code.Unauthenticated) {
          throw new UnauthorizedError();
        }
        throw err;
      }
    },
  };
  return wrapped;
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
  onClusterCreate?: (req: ClustersCreateRequest) => ClustersCreateResponse;
};

export const createMockConnectTransport = (
  fixtures: MockApiFixtures = {},
  overrides: MockTransportOverrides = {},
) => {
  const catalogItems = fixtures.catalogItems ?? [];
  const clusterCatalogItems = fixtures.clusterCatalogItems ?? [];
  const clusterTemplates = fixtures.clusterTemplates ?? [];
  const hostTypes = fixtures.hostTypes ?? [];
  const virtualNetworks = fixtures.virtualNetworks ?? [];
  const subnets = fixtures.subnets ?? [];
  const securityGroups = fixtures.securityGroups ?? [];
  const instanceTypes = fixtures.instanceTypes ?? [];

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
          const template = clusterTemplates.find((i) => i.id === req.id);
          if (!template) {
            throw new ConnectError(`Cluster template not found in test: ${req.id}`, Code.NotFound);
          }
          return {
            object: template,
          };
        },
      });

      router.service(HostTypes, {
        list: () => ({
          items: hostTypes,
          size: hostTypes.length,
          total: hostTypes.length,
        }),
        get: (req) => {
          const hostType = hostTypes.find((i) => i.id === req.id);
          if (!hostType) {
            throw new ConnectError(`Host type not found in test: ${req.id}`, Code.NotFound);
          }
          return {
            object: hostType,
          };
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
            return overrides.onClusterCreate(req);
          }
          return { object: { id: 'cluster-1', ...req.object } };
        },
      });
    }),
  );
};
