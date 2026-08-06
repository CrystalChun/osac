import { Code, ConnectError, type Transport, createRouterTransport } from '@connectrpc/connect';

import type {
  ClusterCatalogItem,
  ClusterTemplate,
  ClustersCreateRequest,
  ClustersCreateResponse,
  ComputeInstanceCatalogItem,
  HostType,
  IdentityProvider,
  IdentityProvidersCreateRequest,
  IdentityProvidersCreateResponse,
  IdentityProvidersUpdateRequest,
  IdentityProvidersUpdateResponse,
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
  IdentityProviders,
  InstanceTypeState,
  InstanceTypes,
  SecurityGroups,
  Subnets,
  VirtualNetworkState,
  VirtualNetworks,
} from '@osac/types';
import type {
  Tenant as PrivateTenant,
  StorageBackend,
  StorageBackendsCreateRequest,
  StorageBackendsCreateResponse,
  StorageBackendsUpdateRequest,
  StorageBackendsUpdateResponse,
  StorageTier,
  StorageTiersCreateRequest,
  StorageTiersCreateResponse,
  StorageTiersListRequest,
  StorageTiersListResponse,
  StorageTiersUpdateRequest,
  StorageTiersUpdateResponse,
  TenantsCreateRequest,
  TenantsCreateResponse,
} from '@osac/types/private';
import {
  Tenants as PrivateTenants,
  StorageBackendState,
  StorageBackends,
  StorageTierState,
  StorageTiers,
} from '@osac/types/private';

import { UnauthorizedError } from '../utils/unauthorizedError';

export type MockApiFixtures = {
  catalogItems?: ComputeInstanceCatalogItem[];
  clusterCatalogItems?: ClusterCatalogItem[];
  clusterTemplates?: ClusterTemplate[];
  hostTypes?: HostType[];
  tenants?: PrivateTenant[];
  virtualNetworks?: VirtualNetwork[];
  subnets?: Subnet[];
  securityGroups?: SecurityGroup[];
  identityProviders?: IdentityProvider[];
  instanceTypes?: InstanceType[];
  storageBackends?: StorageBackend[];
  storageTiers?: StorageTier[];
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

const matchesStorageBackendReadyFilter = (
  filter: string | undefined,
  state: number | undefined,
): boolean => {
  if (!filter?.includes('this.status.state ==')) {
    return true;
  }
  return state === StorageBackendState.READY;
};

export type MockTransportOverrides = {
  onClusterCreate?: (req: ClustersCreateRequest) => ClustersCreateResponse;
  onIdentityProviderCreate?: (
    req: IdentityProvidersCreateRequest,
  ) => IdentityProvidersCreateResponse;
  onIdentityProviderUpdate?: (
    req: IdentityProvidersUpdateRequest,
  ) => IdentityProvidersUpdateResponse;
  onTenantCreate?: (req: TenantsCreateRequest) => TenantsCreateResponse;
  onStorageBackendCreate?: (req: StorageBackendsCreateRequest) => StorageBackendsCreateResponse;
  onStorageBackendUpdate?: (req: StorageBackendsUpdateRequest) => StorageBackendsUpdateResponse;
  onStorageTierList?: (req: StorageTiersListRequest) => StorageTiersListResponse;
  onStorageTierCreate?: (req: StorageTiersCreateRequest) => StorageTiersCreateResponse;
  onStorageTierUpdate?: (req: StorageTiersUpdateRequest) => StorageTiersUpdateResponse;
};

export const createMockConnectTransport = (
  fixtures: MockApiFixtures = {},
  overrides: MockTransportOverrides = {},
) => {
  const catalogItems = fixtures.catalogItems ?? [];
  const clusterCatalogItems = fixtures.clusterCatalogItems ?? [];
  const clusterTemplates = fixtures.clusterTemplates ?? [];
  const hostTypes = fixtures.hostTypes ?? [];
  const tenants = fixtures.tenants ?? [];
  const identityProviders = fixtures.identityProviders ?? [];
  const virtualNetworks = fixtures.virtualNetworks ?? [];
  const subnets = fixtures.subnets ?? [];
  const securityGroups = fixtures.securityGroups ?? [];
  const instanceTypes = fixtures.instanceTypes ?? [];
  const storageBackends = fixtures.storageBackends ?? [];
  const storageTiers = fixtures.storageTiers ?? [];

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
        get: (req) => ({
          object: virtualNetworks.find((i) => i.id === req.id),
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
        get: (req) => ({
          object: subnets.find((i) => i.id === req.id),
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
        get: (req) => ({
          object: instanceTypes.find((i) => i.id === req.id),
        }),
      });

      router.service(IdentityProviders, {
        list: () => ({
          items: identityProviders,
          size: identityProviders.length,
          total: identityProviders.length,
        }),
        get: (req) => ({
          object: identityProviders.find((idp) => idp.id === req.id),
        }),
        create: (req) => {
          if (overrides.onIdentityProviderCreate) {
            return overrides.onIdentityProviderCreate(req);
          }
          return {
            object: { id: 'new-idp-1', ...req.object },
          };
        },
        update: (req) => {
          if (overrides.onIdentityProviderUpdate) {
            return overrides.onIdentityProviderUpdate(req);
          }
          return {
            object: req.object,
          };
        },
        delete: () => ({}),
      });

      router.service(StorageBackends, {
        list: (req) => {
          const items = storageBackends.filter((item) =>
            matchesStorageBackendReadyFilter(req.filter, item.status?.state),
          );
          return { items, size: items.length, total: items.length };
        },
        get: (req) => ({
          object: storageBackends.find((b) => b.id === req.id),
        }),
        create: (req) => {
          if (overrides.onStorageBackendCreate) {
            return overrides.onStorageBackendCreate(req);
          }
          return {
            object: {
              id: 'new-storage-backend-1',
              metadata: req.object?.metadata,
              spec: req.object?.spec,
              status: { state: StorageBackendState.READY },
            },
          };
        },
        update: (req) => {
          if (overrides.onStorageBackendUpdate) {
            return overrides.onStorageBackendUpdate(req);
          }
          return { object: req.object };
        },
        delete: () => ({}),
      });

      router.service(StorageTiers, {
        list: (req) => {
          if (overrides.onStorageTierList) {
            return overrides.onStorageTierList(req);
          }
          return {
            items: storageTiers,
            size: storageTiers.length,
            total: storageTiers.length,
          };
        },
        get: (req) => ({
          object: storageTiers.find((t) => t.id === req.id),
        }),
        create: (req) => {
          if (overrides.onStorageTierCreate) {
            return overrides.onStorageTierCreate(req);
          }
          return {
            object: {
              id: 'new-storage-tier-1',
              metadata: req.object?.metadata,
              spec: req.object?.spec,
              status: { state: StorageTierState.ACTIVE },
            },
          };
        },
        update: (req) => {
          if (overrides.onStorageTierUpdate) {
            return overrides.onStorageTierUpdate(req);
          }
          return { object: req.object };
        },
        delete: () => ({}),
      });

      router.service(PrivateTenants, {
        list: () => ({
          items: tenants,
          size: tenants.length,
          total: tenants.length,
        }),
        get: (req) => ({
          object: tenants.find((t) => t.id === req.id),
        }),
        create: (req) => {
          if (overrides.onTenantCreate) {
            return overrides.onTenantCreate(req);
          }
          return {
            object: {
              id: 'new-tenant-1',
              metadata: req.object?.metadata,
              spec: req.object?.spec,
              status: {
                breakGlassCredentials: {
                  username: 'break-glass-admin',
                  password: 'temp-password-123',
                },
              },
            },
          };
        },
        delete: () => ({}),
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
