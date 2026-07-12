import { describe, expect, it } from 'vitest';

import { apiQueryKey } from './types';

describe('apiQueryKey normalization', () => {
  it('returns only the route when no other args are given', () => {
    expect(apiQueryKey('v1/compute_instances')).toEqual(['v1/compute_instances']);
  });

  it('strips null pathParams', () => {
    expect(apiQueryKey('v1/compute_instances', null)).toEqual(['v1/compute_instances']);
  });

  it('strips empty array pathParams', () => {
    expect(apiQueryKey('v1/compute_instances', [])).toEqual(['v1/compute_instances']);
  });

  it('strips empty object queryParams', () => {
    expect(apiQueryKey('v1/compute_instances', null, {})).toEqual(['v1/compute_instances']);
  });

  it('strips undefined queryParams', () => {
    expect(apiQueryKey('v1/compute_instances', null, undefined)).toEqual(['v1/compute_instances']);
  });

  it('preserves non-empty pathParams', () => {
    expect(apiQueryKey('v1/compute_instances', ['abc'])).toEqual(['v1/compute_instances', ['abc']]);
  });

  it('preserves non-empty queryParams', () => {
    expect(apiQueryKey('v1/compute_instances', null, { filter: 'active' })).toEqual([
      'v1/compute_instances',
      undefined,
      { filter: 'active' },
    ]);
  });

  it('preserves both non-empty pathParams and queryParams', () => {
    expect(apiQueryKey('v1/compute_instances', ['abc'], { filter: 'active' })).toEqual([
      'v1/compute_instances',
      ['abc'],
      { filter: 'active' },
    ]);
  });

  it('strips trailing empty queryParams with non-empty pathParams', () => {
    expect(apiQueryKey('v1/compute_instances', ['abc'], {})).toEqual([
      'v1/compute_instances',
      ['abc'],
    ]);
  });

  it('produces the same key for null and undefined pathParams', () => {
    expect(apiQueryKey('v1/clusters', null)).toEqual(apiQueryKey('v1/clusters', undefined));
    expect(apiQueryKey('v1/clusters', null)).toEqual(apiQueryKey('v1/clusters'));
  });

  it('produces the same key for empty and undefined queryParams', () => {
    expect(apiQueryKey('v1/clusters', null, {})).toEqual(
      apiQueryKey('v1/clusters', null, undefined),
    );
  });
});
