import { describe, expect, it } from 'vitest';
import { SecurityGroupState, SubnetState, VirtualNetworkState } from '@osac/types';

import {
  securityGroupFilterForVirtualNetworkList,
  virtualNetworkFilterForSubnetList,
  VIRTUAL_NETWORK_READY_LIST_FILTER,
} from './networking';

describe('networking list filters', () => {
  it('filters virtual networks to ready state using enum integer', () => {
    expect(VIRTUAL_NETWORK_READY_LIST_FILTER).toBe(
      `this.status.state == ${VirtualNetworkState.READY}`,
    );
  });

  it('combines virtual network scope and ready state for subnets', () => {
    expect(virtualNetworkFilterForSubnetList('vn-1')).toBe(
      `(this.spec.virtual_network == "vn-1") && (this.status.state == ${SubnetState.READY})`,
    );
  });

  it('combines virtual network scope and ready state for security groups', () => {
    expect(securityGroupFilterForVirtualNetworkList('vn-1')).toBe(
      `(this.spec.virtual_network == "vn-1") && (this.status.state == ${SecurityGroupState.READY})`,
    );
  });
});
