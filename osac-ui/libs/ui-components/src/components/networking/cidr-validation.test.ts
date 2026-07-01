import { describe, expect, it } from 'vitest';

import { cidrSchema, hasSubnetOverlap, isSubnetWithinVN } from './cidr-validation';

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

  it('rejects non-CIDR string', async () => {
    await expect(cidrSchema.validate('not-a-cidr')).rejects.toThrow();
  });

  it('rejects empty string', async () => {
    await expect(cidrSchema.validate('')).rejects.toThrow();
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
