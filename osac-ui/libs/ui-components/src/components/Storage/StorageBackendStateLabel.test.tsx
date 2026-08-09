import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StorageBackendState } from '@osac/types/private';

import StorageBackendStateLabel from './StorageBackendStateLabel';
import { renderWithProviders } from '../../test-utils/TestProviders';

describe('StorageBackendStateLabel', () => {
  it('maps READY to ready/Ready', () => {
    renderWithProviders(<StorageBackendStateLabel state={StorageBackendState.READY} />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('maps UNSPECIFIED to unspecified/Unspecified', () => {
    renderWithProviders(<StorageBackendStateLabel state={StorageBackendState.UNSPECIFIED} />);
    expect(screen.getByText('Unspecified')).toBeInTheDocument();
  });

  it('maps undefined to unspecified/Unspecified', () => {
    renderWithProviders(<StorageBackendStateLabel />);
    expect(screen.getByText('Unspecified')).toBeInTheDocument();
  });
});
