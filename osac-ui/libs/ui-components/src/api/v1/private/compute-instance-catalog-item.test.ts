import { describe } from 'vitest';

import type { ComputeInstanceCatalogItem } from '@osac/types/private';
import { ComputeInstanceCatalogItems } from '@osac/types/private';

import { usePrivateComputeInstanceCatalogItems } from './compute-instance-catalog-item';
import { createCatalogHookTests } from '../../../test-utils/catalogHookTestHelpers';

const item: ComputeInstanceCatalogItem = {
  $typeName: 'osac.private.v1.ComputeInstanceCatalogItem',
  id: 'private-1',
  title: 'Private VM item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateComputeInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'private ComputeInstanceCatalogItems',
    useHook: usePrivateComputeInstanceCatalogItems,
    role: 'providerAdmin',
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
