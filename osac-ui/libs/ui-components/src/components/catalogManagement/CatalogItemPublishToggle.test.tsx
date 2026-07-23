import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import CatalogItemPublishToggle from './CatalogItemPublishToggle';
import { renderWithProviders } from '../../test-utils/TestProviders';

describe('CatalogItemPublishToggle', () => {
  it('renders as checked when published', () => {
    renderWithProviders(<CatalogItemPublishToggle published onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('renders as unchecked when not published', () => {
    renderWithProviders(<CatalogItemPublishToggle published={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('calls onChange with the flipped value when toggled', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemPublishToggle published onChange={onChange} />,
    );

    await user.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('does not call onChange when disabled', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <CatalogItemPublishToggle published onChange={onChange} isDisabled />,
    );

    await user.click(screen.getByRole('switch'));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not propagate its click event to an ancestor element', async () => {
    const onAncestorClick = vi.fn();
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <div onClick={onAncestorClick}>
        <CatalogItemPublishToggle published onChange={onChange} />
      </div>,
    );

    await user.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(false);
    expect(onAncestorClick).not.toHaveBeenCalled();
  });
});
