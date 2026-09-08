import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ExternalIPPool } from '@osac/types/private';
import { ExternalIPPoolState, IPFamily } from '@osac/types/private';

import ExternalIpPoolReviewColumn from './ExternalIpPoolReviewColumn';
import { renderWithProviders } from '../../../test-utils/TestProviders';

const makePool = (tenant?: string): ExternalIPPool =>
  ({
    id: 'p-1',
    metadata: {
      name: 'prod-v4',
      tenant,
      creationTimestamp: { seconds: BigInt(1700000000), nanos: 0 },
    },
    spec: { cidrs: ['192.168.1.0/24'], ipFamily: IPFamily.IP_FAMILY_IPV4 },
    status: { state: ExternalIPPoolState.EXTERNAL_IP_POOL_STATE_READY },
  }) as ExternalIPPool;

describe('ExternalIpPoolReviewColumn', () => {
  it('renders status above the created timestamp', () => {
    renderWithProviders(<ExternalIpPoolReviewColumn pool={makePool()} />);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByLabelText('External IP pool overview').textContent).toMatch(
      /Status.*Created/s,
    );
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2023-11-14T22:13:20.000Z');
    expect(screen.queryByText('Tenant')).not.toBeInTheDocument();
  });

  it('renders the tenant after Created when metadata.tenant is set', () => {
    renderWithProviders(<ExternalIpPoolReviewColumn pool={makePool('acme')} />);

    expect(screen.getByLabelText('External IP pool overview').textContent).toMatch(
      /Created.*Tenant/s,
    );
    expect(screen.getByText('acme')).toBeInTheDocument();
  });

  it('labels the shared tenant as Shared', () => {
    renderWithProviders(<ExternalIpPoolReviewColumn pool={makePool('shared')} />);

    expect(screen.getByText('Shared')).toBeInTheDocument();
  });
});
