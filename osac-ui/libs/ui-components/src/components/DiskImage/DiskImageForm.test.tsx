import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Architecture, DiskImagesCreateResponseSchema, GuestOSFamily, SourceType } from '@osac/types';

import DiskImageForm, { DISK_IMAGES_LIST_ROUTE } from './DiskImageForm';
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

const renderForm = (overrides?: MockTransportOverrides) =>
  renderWithProviders(<DiskImageForm />, { transportOverrides: overrides });

const fillValidForm = async (user: ReturnType<typeof renderForm>['user']) => {
  await user.type(screen.getByRole('textbox', { name: 'Name' }), 'rhel-9');
  await user.type(
    screen.getByRole('textbox', { name: 'Source reference' }),
    'quay.io/example/rhel:9',
  );
  await user.click(screen.getByRole('button', { name: 'Architecture' }));
  await user.click(screen.getByRole('option', { name: 'amd64' }));
};

describe('DiskImageForm', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the documented create-mode fields', () => {
    renderForm();

    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Source reference' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guest OS family' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Architecture' })).toBeInTheDocument();
    expect(screen.getByText('REGISTRY')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows a validation error when submitting an empty source reference', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Source reference is required')).toBeInTheDocument();
    });
  });

  it('shows a validation error when submitting with no architecture selected', async () => {
    const { user } = renderForm();

    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'rhel-9');
    await user.type(
      screen.getByRole('textbox', { name: 'Source reference' }),
      'quay.io/example/rhel:9',
    );
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('Select at least one architecture')).toBeInTheDocument();
    });
  });

  it('navigates back to the disk image list on cancel', async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockNavigate).toHaveBeenCalledWith(DISK_IMAGES_LIST_ROUTE);
  });

  describe('submission', () => {
    const CREATED_ID = 'disk-image-created-1';

    it('creates the disk image with the expected payload and navigates to its detail page', async () => {
      let captured: Record<string, unknown> | undefined;
      const { user } = renderForm({
        onDiskImageCreate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(DiskImagesCreateResponseSchema, {
            object: { ...req.object, id: CREATED_ID },
          });
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`${DISK_IMAGES_LIST_ROUTE}/${CREATED_ID}`);
      });
      const object = captured?.object as {
        metadata?: { name?: string; tenant?: string };
        spec?: { sourceType?: SourceType; sourceRef?: string; architecture?: Architecture[] };
      };
      expect(object?.metadata?.name).toBe('rhel-9');
      expect(object?.metadata?.tenant).toBe('');
      expect(object?.spec?.sourceType).toBe(SourceType.REGISTRY);
      expect(object?.spec?.sourceRef).toBe('quay.io/example/rhel:9');
      expect(object?.spec?.architecture).toEqual([Architecture.AMD64]);
    });

    it('defaults guest OS family to Linux', async () => {
      let captured: Record<string, unknown> | undefined;
      const { user } = renderForm({
        onDiskImageCreate: (req) => {
          captured = req as unknown as Record<string, unknown>;
          return create(DiskImagesCreateResponseSchema, {
            object: { ...req.object, id: CREATED_ID },
          });
        },
      });

      await fillValidForm(user);
      await user.click(screen.getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(`${DISK_IMAGES_LIST_ROUTE}/${CREATED_ID}`);
      });
      const spec = (captured?.object as { spec?: { guestOsFamily?: GuestOSFamily } })?.spec;
      expect(spec?.guestOsFamily).toBe(GuestOSFamily.GUEST_OS_FAMILY_LINUX);
    });
  });
});
