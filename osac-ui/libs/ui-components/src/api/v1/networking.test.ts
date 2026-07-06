import { describe, expect, it } from 'vitest';

import { SecurityGroupState, SubnetState, VirtualNetworkState } from '@osac/types';

import {
  VIRTUAL_NETWORK_READY_LIST_FILTER,
  escapeCelStringLiteral,
  securityGroupFilterForVirtualNetworkList,
  virtualNetworkFilterForSubnetList,
} from './networking';

describe('networking list filters', () => {
  it('filters virtual networks to ready state using enum integer', () => {
    expect(VIRTUAL_NETWORK_READY_LIST_FILTER).toBe(
      `this.status.state == ${VirtualNetworkState.READY}`,
    );
  });

  it('escapes embedded quotes for CEL string literals', () => {
    expect(escapeCelStringLiteral('say "hello"')).toBe('say \\"hello\\"');
  });

  it('escapes backslashes for CEL string literals', () => {
    expect(escapeCelStringLiteral('path\\to\\thing')).toBe('path\\\\to\\\\thing');
  });

  it('combines virtual network scope and ready state for subnets', () => {
    expect(virtualNetworkFilterForSubnetList('vn-1')).toBe(
      `(this.spec.virtual_network == "vn-1") && (this.status.state == ${SubnetState.READY})`,
    );
  });

  it('escapes quotes in virtual network id when building subnet filter', () => {
    expect(virtualNetworkFilterForSubnetList('vn-"evil')).toBe(
      `(this.spec.virtual_network == "vn-\\"evil") && (this.status.state == ${SubnetState.READY})`,
    );
  });

  it('escapes CEL injection characters in virtual network id when building subnet filter', () => {
    expect(virtualNetworkFilterForSubnetList(`"'] || true || this.id in ['`)).toBe(
      `(this.spec.virtual_network == "\\"'] || true || this.id in ['") && (this.status.state == ${SubnetState.READY})`,
    );
  });

  it('combines virtual network scope and ready state for security groups', () => {
    expect(securityGroupFilterForVirtualNetworkList('vn-1')).toBe(
      `(this.spec.virtual_network == "vn-1") && (this.status.state == ${SecurityGroupState.READY})`,
    );
  });
});
