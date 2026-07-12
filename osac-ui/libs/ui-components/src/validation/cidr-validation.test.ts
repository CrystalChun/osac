import { describe, expect, it } from 'vitest';

import {
  cidrSchema,
  cidrsOverlap,
  hasSubnetOverlap,
  isSubnetWithinVN,
  isValidCidr,
} from './cidr-validation';

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
    ['10.0.0.0/33', false],
    ['256.0.0.0/8', false],
  ])('validates %j as %s', (value, expected) => {
    expect(isValidCidr(value)).toBe(expected);
  });
});

describe('cidrsOverlap', () => {
  it('detects identical overlapping CIDRs', () => {
    expect(cidrsOverlap('10.128.0.0/14', '10.128.0.0/14')).toBe(true);
  });

  it('allows non-overlapping CIDRs', () => {
    expect(cidrsOverlap('10.128.0.0/14', '172.30.0.0/16')).toBe(false);
  });

  it('ignores empty values', () => {
    expect(cidrsOverlap('', '172.30.0.0/16')).toBe(false);
  });

  it('detects containment overlap when one CIDR is within another', () => {
    expect(cidrsOverlap('10.0.0.0/8', '10.128.0.0/14')).toBe(true);
  });
});

describe('cidrSchema', () => {
  it('validates valid IPv4 CIDR with prefix', async () => {
    await expect(cidrSchema.validate('192.168.1.0/24')).resolves.toBe('192.168.1.0/24');
  });

  it('validates valid IPv4 CIDR with /16 prefix', async () => {
    await expect(cidrSchema.validate('10.0.0.0/16')).resolves.toBe('10.0.0.0/16');
  });

  it('validates valid IPv4 CIDR with /32 prefix', async () => {
    await expect(cidrSchema.validate('172.16.0.1/32')).resolves.toBe('172.16.0.1/32');
  });

  it('rejects invalid CIDR without prefix', async () => {
    await expect(cidrSchema.validate('192.168.1.0')).rejects.toThrow();
  });

  it('rejects invalid CIDR with invalid IP', async () => {
    await expect(cidrSchema.validate('999.999.999.999/24')).rejects.toThrow();
  });

  it('rejects invalid CIDR with invalid prefix', async () => {
    await expect(cidrSchema.validate('192.168.1.0/99')).rejects.toThrow();
  });

  it('validates valid IPv6 CIDR with compressed prefix', async () => {
    await expect(cidrSchema.validate('2001:db8::/32')).resolves.toBe('2001:db8::/32');
  });

  it('rejects invalid IPv6 CIDR with invalid prefix', async () => {
    await expect(cidrSchema.validate('2001:db8::/199')).rejects.toThrow();
  });

  it('rejects non-CIDR string', async () => {
    await expect(cidrSchema.validate('not-a-cidr')).rejects.toThrow();
  });

  it('allows empty string for optional fields', async () => {
    await expect(cidrSchema.validate('')).resolves.toBe('');
  });

  it('rejects empty string when required', async () => {
    await expect(cidrSchema.required('CIDR is required').validate('')).rejects.toThrow();
  });
});

describe('isSubnetWithinVN', () => {
  it('returns true when subnet is within parent VN', () => {
    expect(isSubnetWithinVN('192.168.1.0/26', '192.168.1.0/24')).toBe(true);
  });

  it('returns true when subnet equals parent VN', () => {
    expect(isSubnetWithinVN('192.168.1.0/24', '192.168.1.0/24')).toBe(true);
  });

  it('returns false when subnet is outside parent VN', () => {
    expect(isSubnetWithinVN('192.168.2.0/24', '192.168.1.0/24')).toBe(false);
  });

  it('returns false when subnet is larger than parent VN', () => {
    expect(isSubnetWithinVN('192.168.0.0/16', '192.168.1.0/24')).toBe(false);
  });

  it('returns true for subnet at end of parent range', () => {
    expect(isSubnetWithinVN('10.0.255.0/24', '10.0.0.0/16')).toBe(true);
  });

  it('returns false when subnet starts in range but extends beyond', () => {
    expect(isSubnetWithinVN('192.168.1.128/24', '192.168.1.0/25')).toBe(false);
  });
});

describe('hasSubnetOverlap', () => {
  it('returns false when no existing subnets', () => {
    expect(hasSubnetOverlap('192.168.1.0/26', [])).toBe(false);
  });

  it('returns false when subnet does not overlap', () => {
    expect(hasSubnetOverlap('192.168.1.64/26', ['192.168.1.0/26'])).toBe(false);
  });

  it('returns true when subnet exactly matches existing', () => {
    expect(hasSubnetOverlap('192.168.1.0/26', ['192.168.1.0/26'])).toBe(true);
  });

  it('returns true when subnet contains existing subnet', () => {
    expect(hasSubnetOverlap('192.168.1.0/24', ['192.168.1.0/26'])).toBe(true);
  });

  it('returns true when existing subnet contains new subnet', () => {
    expect(hasSubnetOverlap('192.168.1.0/26', ['192.168.1.0/24'])).toBe(true);
  });

  it('returns true when subnet partially overlaps', () => {
    expect(hasSubnetOverlap('192.168.1.32/26', ['192.168.1.0/25'])).toBe(true);
  });

  it('returns false when none of multiple subnets overlap', () => {
    expect(hasSubnetOverlap('192.168.1.128/26', ['192.168.1.0/26', '192.168.1.64/26'])).toBe(false);
  });

  it('returns true when at least one of multiple subnets overlaps', () => {
    expect(hasSubnetOverlap('192.168.1.64/26', ['192.168.1.0/26', '192.168.1.64/26'])).toBe(true);
  });
});
