import PauseIcon from '@patternfly/react-icons/dist/esm/icons/pause-icon';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResourceStatusLabel } from './ResourceStatusLabel';

describe('ResourceStatusLabel', () => {
  it('renders default ready styling', () => {
    render(<ResourceStatusLabel status="ready" text="Running" />);
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('applies color override when provided', () => {
    const { container } = render(
      <ResourceStatusLabel status="ready" text="Paused" color="grey" icon={PauseIcon} />,
    );
    expect(screen.getByText('Paused')).toBeInTheDocument();
    expect(container.querySelector('.pf-v6-c-label')).toBeTruthy();
  });
});
