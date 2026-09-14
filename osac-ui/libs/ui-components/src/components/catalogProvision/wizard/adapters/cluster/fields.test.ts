import { describe, expect, it } from 'vitest';

import { createEmptyNodeSetRow, createNodeSetId } from './fields';

describe('createNodeSetId', () => {
  it('numbers node sets independently for each host type', () => {
    const rows = [
      { ...createEmptyNodeSetRow(), hostType: 'x', id: 'x-1' },
      { ...createEmptyNodeSetRow(), hostType: 'x', id: 'x-2' },
    ];

    expect(createNodeSetId('y', rows, 0)).toBe('y-1');
    expect(createNodeSetId('x', [...rows, createEmptyNodeSetRow()], 2)).toBe('x-3');
  });

  it('uses the next available suffix after a node set is removed', () => {
    const rows = [
      { ...createEmptyNodeSetRow(), hostType: 'x', id: 'x-1' },
      { ...createEmptyNodeSetRow(), hostType: 'x', id: 'x-3' },
    ];

    expect(createNodeSetId('x', [...rows, createEmptyNodeSetRow()], 2)).toBe('x-2');
  });

  it('preserves the current ID when the host type is unchanged', () => {
    const rows = [{ ...createEmptyNodeSetRow(), hostType: 'x', id: 'x-4' }];

    expect(createNodeSetId('x', rows, 0)).toBe('x-4');
  });
});
