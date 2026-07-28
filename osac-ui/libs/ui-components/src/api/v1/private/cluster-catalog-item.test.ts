import { describe } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types/private';
import { ClusterCatalogItems } from '@osac/types/private';

import { usePrivateClusterCatalogItems } from './cluster-catalog-item';
import { createCatalogHookTests } from '../../../test-utils/catalogHookTestHelpers';

const item: ClusterCatalogItem = {
  $typeName: 'osac.private.v1.ClusterCatalogItem',
  id: 'private-1',
  title: 'Private cluster item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateClusterCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'private ClusterCatalogItems',
    useHook: usePrivateClusterCatalogItems,
    role: 'providerAdmin',
    item,
    registerList: (router, onList) =>
      router.service(ClusterCatalogItems, {
        list: () => {
          onList?.();
          return { items: [item] };
        },
      }),
  });
});
