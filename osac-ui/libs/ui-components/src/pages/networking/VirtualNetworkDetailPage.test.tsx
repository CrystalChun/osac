import { describe, expect, it } from 'vitest';

import { VirtualNetworkDetailPage } from './VirtualNetworkDetailPage';

describe('VirtualNetworkDetailPage', () => {
  it('exports the component', () => {
    expect(VirtualNetworkDetailPage).toBeDefined();
    expect(typeof VirtualNetworkDetailPage).toBe('function');
  });
});
