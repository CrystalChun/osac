import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { Metadata } from '@osac/types';

import ResourceOverviewColumn from './ResourceOverviewColumn';
import { renderWithProviders } from '../../test-utils/TestProviders';

const metadata = {
  name: 'prod-v4',
  creationTimestamp: { seconds: BigInt(1700000000), nanos: 0 },
} as Metadata;

describe('ResourceOverviewColumn', () => {
  it('renders the status node above the created timestamp', () => {
    renderWithProviders(<ResourceOverviewColumn metadata={metadata} status={<span>Ready</span>} />);

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByLabelText('Overview').textContent).toMatch(/Status.*Created/s);
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByRole('time')).toHaveAttribute('dateTime', '2023-11-14T22:13:20.000Z');
  });

  it('omits the status row when status is not provided', () => {
    renderWithProviders(<ResourceOverviewColumn metadata={metadata} />);

    expect(screen.queryByText('Status')).not.toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders extra description-list groups after Created', () => {
    renderWithProviders(
      <ResourceOverviewColumn metadata={metadata}>
        <DescriptionListGroup>
          <DescriptionListTerm>Tenant</DescriptionListTerm>
          <DescriptionListDescription>Shared</DescriptionListDescription>
        </DescriptionListGroup>
      </ResourceOverviewColumn>,
    );

    expect(screen.getByLabelText('Overview').textContent).toMatch(/Created.*Tenant/s);
  });
});
