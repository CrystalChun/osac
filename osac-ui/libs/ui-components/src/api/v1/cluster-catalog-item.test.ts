import { describe } from 'vitest';

import type { ClusterCatalogItem } from '@osac/types';
import { ClusterCatalogItems } from '@osac/types';

import { useClusterCatalogItems } from './cluster-catalog-item';
import { createCatalogHookTests } from '../../test-utils/catalogHookTestHelpers';

const item: ClusterCatalogItem = {
  $typeName: 'osac.public.v1.ClusterCatalogItem',
  id: 'public-1',
  title: 'Public cluster item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

describe('useClusterCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'public ClusterCatalogItems',
    useHook: useClusterCatalogItems,
    role: 'tenantAdmin',
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
