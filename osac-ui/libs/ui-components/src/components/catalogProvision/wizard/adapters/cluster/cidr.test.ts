import { describe, expect, it } from 'vitest';

import { isValidCidr } from './cidr';

describe('isValidCidr', () => {
  it.each([
    ['', true],
    ['   ', true],
    ['10.128.0.0/14', true],
    ['172.30.0.0/16', true],
    ['fd01::/48', true],
    ['not-a-cidr', false],
    ['10.0.0.0', false],
    ['10.0.0.0/', false],
    ['/24', false],
    ['10.0.0.0/33', true],
    ['256.0.0.0/8', false],
  ])('validates %j as %s', (value, expected) => {
    expect(isValidCidr(value)).toBe(expected);
  });
});
