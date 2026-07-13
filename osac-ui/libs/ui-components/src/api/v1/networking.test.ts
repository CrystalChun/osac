import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';

import {
  SecurityGroupState,
  SubnetSchema,
  SubnetState,
  VirtualNetworkSchema,
  VirtualNetworkState,
} from '@osac/types';

import { decodeFulfillmentResponse } from '../fulfillment-decode';
import {
  VIRTUAL_NETWORK_READY_LIST_FILTER,
  escapeCelStringLiteral,
  invalidateSecurityGroupsQueries,
  invalidateSubnetsQueries,
  invalidateVirtualNetworksQueries,
  securityGroupFilterForVirtualNetwork,
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

  it('filters security groups by virtual network id', () => {
    expect(securityGroupFilterForVirtualNetwork('vn-123')).toBe(
      'this.spec.virtual_network == "vn-123"',
    );
  });

  it('escapes quotes in virtual network id for security group filter', () => {
    expect(securityGroupFilterForVirtualNetwork('vn-"evil')).toBe(
      'this.spec.virtual_network == "vn-\\"evil"',
    );
  });

  it('escapes CEL injection in virtual network id for security group filter', () => {
    expect(securityGroupFilterForVirtualNetwork(`"'] || true || this.id in ['`)).toBe(
      `this.spec.virtual_network == "\\"'] || true || this.id in ['"`,
    );
  });

  it('escapes trailing backslash in virtual network id for security group filter', () => {
    expect(securityGroupFilterForVirtualNetwork('vn-\\')).toBe(
      'this.spec.virtual_network == "vn-\\\\"',
    );
  });
});

describe('networking query invalidation', () => {
  const asApiQueryClient = (qc: QueryClient) =>
    qc as unknown as Parameters<typeof invalidateVirtualNetworksQueries>[0];

  it('invalidates both the list and by-id virtual network queries', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['v1/virtual_networks', null, {}], { items: [] });
    qc.setQueryData(['v1/virtual_networks', ['vn-1']], { id: 'vn-1' });

    await invalidateVirtualNetworksQueries(asApiQueryClient(qc));

    expect(qc.getQueryState(['v1/virtual_networks', null, {}])?.isInvalidated).toBe(true);
    expect(qc.getQueryState(['v1/virtual_networks', ['vn-1']])?.isInvalidated).toBe(true);
  });

  it('invalidates both the list and by-id subnet queries', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['v1/subnets', null, {}], { items: [] });
    qc.setQueryData(['v1/subnets', ['subnet-1']], { id: 'subnet-1' });

    await invalidateSubnetsQueries(asApiQueryClient(qc));

    expect(qc.getQueryState(['v1/subnets', null, {}])?.isInvalidated).toBe(true);
    expect(qc.getQueryState(['v1/subnets', ['subnet-1']])?.isInvalidated).toBe(true);
  });

  it('invalidates both the list and by-id security group queries', async () => {
    const qc = new QueryClient();
    qc.setQueryData(['v1/security_groups', null, {}], { items: [] });
    qc.setQueryData(['v1/security_groups', ['sg-1']], { id: 'sg-1' });

    await invalidateSecurityGroupsQueries(asApiQueryClient(qc));

    expect(qc.getQueryState(['v1/security_groups', null, {}])?.isInvalidated).toBe(true);
    expect(qc.getQueryState(['v1/security_groups', ['sg-1']])?.isInvalidated).toBe(true);
  });
});

describe('virtualNetwork create response decode', () => {
  it('decodes the unwrapped REST create body as a VirtualNetwork', () => {
    const payload = {
      id: '019f0d21-d4c2-7102-9cde-4a909ca1c070',
      metadata: { name: 'vn-prod' },
      spec: {
        ipv4_cidr: '10.0.0.0/16',
      },
      status: { state: 'VIRTUAL_NETWORK_STATE_PENDING' },
    };

    const decoded = decodeFulfillmentResponse(VirtualNetworkSchema, payload) as {
      id: string;
      metadata?: { name?: string };
    };

    expect(decoded.id).toBe('019f0d21-d4c2-7102-9cde-4a909ca1c070');
    expect(decoded.metadata?.name).toBe('vn-prod');
  });
});

describe('subnet create response decode', () => {
  it('decodes the unwrapped REST create body as a Subnet', () => {
    const payload = {
      id: '019f0d21-d4c2-7102-9cde-4a909ca1c071',
      metadata: { name: 'subnet-web' },
      spec: {
        virtual_network: '019f0d21-d4c2-7102-9cde-4a909ca1c070',
        ipv4_cidr: '10.0.1.0/24',
      },
      status: { state: 'SUBNET_STATE_PENDING' },
    };

    const decoded = decodeFulfillmentResponse(SubnetSchema, payload) as {
      id: string;
      metadata?: { name?: string };
    };

    expect(decoded.id).toBe('019f0d21-d4c2-7102-9cde-4a909ca1c071');
    expect(decoded.metadata?.name).toBe('subnet-web');
  });
});
