import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CatalogItemStatusLabel from './CatalogItemStatusLabel';
import { renderWithProviders } from '../../test-utils/TestProviders';

describe('CatalogItemStatusLabel', () => {
  it('renders "Published" in green when published', () => {
    renderWithProviders(<CatalogItemStatusLabel published />);
    const label = screen.getByText('Published');
    expect(label.closest('.pf-v6-c-label')).toHaveClass('pf-m-green');
  });

  it('renders "Unpublished" in grey when not published', () => {
    renderWithProviders(<CatalogItemStatusLabel published={false} />);
    const label = screen.getByText('Unpublished');
    expect(label.closest('.pf-v6-c-label')).not.toHaveClass('pf-m-green');
  });
});
