import { create } from '@bufbuild/protobuf';
import { Code, ConnectError } from '@connectrpc/connect';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { InstanceTypesCreateResponseSchema } from '@osac/types/private';

import AdminInstanceTypeCreatePage from './AdminInstanceTypeCreatePage';
import type { MockTransportOverrides } from '../../test-utils/createMockConnectTransport';
import { renderWithProviders } from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const LIST_ROUTE = '/admin/infrastructure/instance-types';

const renderPage = (overrides?: MockTransportOverrides) =>
  renderWithProviders(<AdminInstanceTypeCreatePage />, {
    transportOverrides: overrides,
  });

const fillValidForm = async (user: ReturnType<typeof renderPage>['user']) => {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'gp-small');
  fireEvent.change(screen.getByRole('spinbutton', { name: 'CPU cores' }), {
    target: { value: '4' },
  });
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Memory (GiB)' }), {
    target: { value: '16' },
  });
};

describe('AdminInstanceTypeCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the page title and documented fields', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Create instance type' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'CPU cores' })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Memory (GiB)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('renders breadcrumb with link back to instance type list', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Instance types' })).toBeInTheDocument();
  });

  it('keeps the Create button enabled before any interaction', () => {
    renderPage();

    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('shows a validation error when submitting an empty name, without disabling Create', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it.each([
    ['blank', '', 'CPU cores is required'],
    ['decimal', '1.5', 'CPU cores must be a positive integer'],
    ['zero', '0', 'CPU cores must be a positive integer'],
    ['negative', '-1', 'CPU cores must be a positive integer'],
  ])('shows a validation error for %s CPU cores', async (_label, cores, expectedMessage) => {
    const { user } = renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'gp-small');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'CPU cores' }), {
      target: { value: cores },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Memory (GiB)' }), {
      target: { value: '16' },
    });
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  });

  it.each([
    ['blank', '', 'Memory (GiB) is required'],
    ['decimal', '1.5', 'Memory (GiB) must be a positive integer'],
    ['zero', '0', 'Memory (GiB) must be a positive integer'],
    ['negative', '-1', 'Memory (GiB) must be a positive integer'],
  ])('shows a validation error for %s Memory (GiB)', async (_label, memoryGib, expectedMessage) => {
    const { user } = renderPage();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'gp-small');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'CPU cores' }), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Memory (GiB)' }), {
      target: { value: memoryGib },
    });
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    });
  });

  it('navigates back to the instance type list on cancel', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith(LIST_ROUTE);
  });

  it('navigates back to the instance type list via breadcrumb', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Instance types' }));

    expect(mockNavigate).toHaveBeenCalledWith(LIST_ROUTE);
  });

  describe('submission', () => {
    it('creates the instance type with integer-converted cores/memory and navigates to the list', async () => {
      let captured: Record<string, unknown> | undefined;
      const { user } = renderPage({
        onInstanceTypeCreate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(InstanceTypesCreateResponseSchema, { object: req.object });
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(LIST_ROUTE);
      });
      const spec = (captured?.object as { spec?: { cores?: number; memoryGib?: number } })?.spec;
      expect(spec?.cores).toBe(4);
      expect(spec?.memoryGib).toBe(16);
    });

    it('shows a dismissible error alert when create fails', async () => {
      const { user } = renderPage({
        onInstanceTypeCreate: () => {
          throw new ConnectError('Instance type name already exists', Code.AlreadyExists);
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create instance type')).toBeInTheDocument();
      });
      expect(screen.getByText('Instance type name already exists')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /^Close/ }));

      expect(screen.queryByText('Failed to create instance type')).not.toBeInTheDocument();
    });

    it('maps a spec.cores backend field violation onto the CPU cores input', async () => {
      const { user } = renderPage({
        onInstanceTypeCreate: () => {
          throw new ConnectError(
            "field 'spec.cores' must be greater than zero",
            Code.InvalidArgument,
          );
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(screen.getByRole('spinbutton', { name: 'CPU cores' })).toHaveAccessibleDescription(
          /field 'spec\.cores' must be greater than zero/,
        );
      });
      expect(screen.queryByText('Failed to create instance type')).not.toBeInTheDocument();
    });
  });
});
