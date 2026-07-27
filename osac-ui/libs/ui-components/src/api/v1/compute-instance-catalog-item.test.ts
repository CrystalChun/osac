import { describe } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types';
import { ComputeInstanceCatalogItems } from '@osac/types';

import { useComputeInstanceCatalogItems } from './compute-instance-catalog-item';
import { createCatalogHookTests } from '../../test-utils/catalogHookTestHelpers';

const item: ComputeInstanceCatalogItem = {
  $typeName: 'osac.public.v1.ComputeInstanceCatalogItem',
  id: 'public-1',
  title: 'Public VM item',
  description: '',
  template: '',
  published: true,
  fieldDefinitions: [],
};

describe('useComputeInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'public ComputeInstanceCatalogItems',
    useHook: useComputeInstanceCatalogItems,
    role: 'tenantAdmin',
    item,
    registerList: (router, onList) =>
      router.service(ComputeInstanceCatalogItems, {
        list: () => {
          onList?.();
          return { items: [item] };
        },
      }),
  });
});
