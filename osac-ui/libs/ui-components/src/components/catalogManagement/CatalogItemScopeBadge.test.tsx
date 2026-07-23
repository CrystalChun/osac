import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import CatalogItemScopeBadge from './CatalogItemScopeBadge';
import { renderWithProviders } from '../../test-utils/TestProviders';

describe('CatalogItemScopeBadge', () => {
  it('renders "General" in blue for general scope', () => {
    renderWithProviders(<CatalogItemScopeBadge scope={{ level: 'general' }} />);
    const label = screen.getByText('General');
    expect(label.closest('.pf-v6-c-label')).toHaveClass('pf-m-blue');
  });

  it('renders "Organization: {name}" in purple when a tenant name is known', () => {
    renderWithProviders(
      <CatalogItemScopeBadge scope={{ level: 'organization', name: 'acme-corp' }} />,
    );
    const label = screen.getByText('Organization: acme-corp');
    expect(label.closest('.pf-v6-c-label')).toHaveClass('pf-m-purple');
  });

  it('renders plain "Organization" in purple when no tenant name is known', () => {
    renderWithProviders(<CatalogItemScopeBadge scope={{ level: 'organization' }} />);
    const label = screen.getByText('Organization');
    expect(label.closest('.pf-v6-c-label')).toHaveClass('pf-m-purple');
  });

  it('renders "Project: {name}" in teal for project scope', () => {
    renderWithProviders(<CatalogItemScopeBadge scope={{ level: 'project', name: 'frontend' }} />);
    const label = screen.getByText('Project: frontend');
    expect(label.closest('.pf-v6-c-label')).toHaveClass('pf-m-teal');
  });
});
