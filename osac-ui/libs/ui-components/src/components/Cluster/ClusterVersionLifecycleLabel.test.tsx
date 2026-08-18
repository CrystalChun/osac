import { create } from '@bufbuild/protobuf';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ClusterVersionDeprecationSchema, ClusterVersionState } from '@osac/types';

import ClusterVersionLifecycleLabel from './ClusterVersionLifecycleLabel';

const expectLabelColor = (text: string, colorClass?: string) => {
  const label = screen.getByText(text).closest('.pf-v6-c-label');

  expect(label).not.toBeNull();
  if (colorClass) {
    expect(label).toHaveClass(colorClass);
    return;
  }

  expect(label).not.toHaveClass('pf-m-green');
  expect(label).not.toHaveClass('pf-m-orange');
};

const timestampFor = (iso: string) => ({
  seconds: BigInt(Math.floor(Date.parse(iso) / 1000)),
  nanos: 0,
});

describe('ClusterVersionLifecycleLabel', () => {
  it('renders active versions in green with no tooltip', async () => {
    const user = userEvent.setup();
    render(<ClusterVersionLifecycleLabel state={ClusterVersionState.ACTIVE} />);

    expectLabelColor('Active', 'pf-m-green');
    await user.hover(screen.getByText('Active'));
    expect(screen.queryByText(/since/i)).toBeNull();
  });

  it('renders deprecated versions in orange', () => {
    render(<ClusterVersionLifecycleLabel state={ClusterVersionState.DEPRECATED} />);

    expectLabelColor('Deprecated', 'pf-m-orange');
  });

  it('renders obsolete versions in grey', () => {
    render(<ClusterVersionLifecycleLabel state={ClusterVersionState.OBSOLETE} />);

    expectLabelColor('Obsolete');
  });

  it('falls back to unknown when the state is missing', () => {
    render(<ClusterVersionLifecycleLabel />);

    expectLabelColor('Unknown');
  });

  it('falls back to unknown when the state is not a known lifecycle state', () => {
    render(<ClusterVersionLifecycleLabel state={99 as ClusterVersionState} />);

    expectLabelColor('Unknown');
  });

  it('shows a deprecation tooltip when the deprecation timestamp is present', async () => {
    const user = userEvent.setup();
    render(
      <ClusterVersionLifecycleLabel
        state={ClusterVersionState.DEPRECATED}
        deprecation={create(ClusterVersionDeprecationSchema, {
          deprecationTimestamp: timestampFor('2026-03-15T12:00:00Z'),
        })}
      />,
    );

    await user.hover(screen.getByText('Deprecated'));
    expect(await screen.findByText(/Deprecated since/)).toBeInTheDocument();
  });

  it('shows an obsolescence tooltip when the obsolescence timestamp is present', async () => {
    const user = userEvent.setup();
    render(
      <ClusterVersionLifecycleLabel
        state={ClusterVersionState.OBSOLETE}
        deprecation={create(ClusterVersionDeprecationSchema, {
          obsolescenceTimestamp: timestampFor('2026-06-01T12:00:00Z'),
        })}
      />,
    );

    await user.hover(screen.getByText('Obsolete'));
    expect(await screen.findByText(/Obsolete since/)).toBeInTheDocument();
  });

  it('exposes the deprecation tooltip on keyboard focus, not just hover', async () => {
    const user = userEvent.setup();
    render(
      <ClusterVersionLifecycleLabel
        state={ClusterVersionState.DEPRECATED}
        deprecation={create(ClusterVersionDeprecationSchema, {
          deprecationTimestamp: timestampFor('2026-03-15T12:00:00Z'),
        })}
      />,
    );

    await user.tab();
    expect(await screen.findByText(/Deprecated since/)).toBeInTheDocument();
  });

  it('renders deprecated without a tooltip when no timestamp is present', async () => {
    const user = userEvent.setup();
    render(<ClusterVersionLifecycleLabel state={ClusterVersionState.DEPRECATED} />);

    expectLabelColor('Deprecated', 'pf-m-orange');
    await user.hover(screen.getByText('Deprecated'));
    expect(screen.queryByText(/since/i)).toBeNull();
  });
});
