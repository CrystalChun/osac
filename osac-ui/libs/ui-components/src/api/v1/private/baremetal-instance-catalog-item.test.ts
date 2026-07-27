import { describe } from 'vitest';

import type { BareMetalInstanceCatalogItem } from '@osac/types/private';
import { BareMetalInstanceCatalogItems } from '@osac/types/private';

import { usePrivateBareMetalInstanceCatalogItems } from './baremetal-instance-catalog-item';
import { createCatalogHookTests } from '../../../test-utils/catalogHookTestHelpers';

const item: BareMetalInstanceCatalogItem = {
  $typeName: 'osac.private.v1.BareMetalInstanceCatalogItem',
  id: 'private-1',
  title: 'Private bare metal item',
  description: '',
  template: '',
  published: true,
  tenant: 'acme-corp',
  fieldDefinitions: [],
};

describe('usePrivateBareMetalInstanceCatalogItems', () => {
  createCatalogHookTests({
    endpointDescription: 'private BareMetalInstanceCatalogItems',
    useHook: usePrivateBareMetalInstanceCatalogItems,
    role: 'providerAdmin',
    item,
    registerList: (router, onList) =>
      router.service(BareMetalInstanceCatalogItems, {
        list: () => {
          onList?.();
          return { items: [item] };
        },
      }),
  });
});
