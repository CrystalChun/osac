import { describe, expect, it } from 'vitest';

import { VirtualNetworksListPage } from './VirtualNetworksListPage';

describe('VirtualNetworksListPage', () => {
  it('exports the component', () => {
    expect(VirtualNetworksListPage).toBeDefined();
    expect(typeof VirtualNetworksListPage).toBe('function');
  });
});
