import { create } from '@bufbuild/protobuf';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Architecture, DiskImageSchema, GuestOSFamily, SourceType } from '@osac/types';

import DiskImageCreatePage from './DiskImageCreatePage';
import { renderWithProviders } from '../../test-utils/TestProviders';

vi.mock('../../hooks/use-session', () => ({
  useSession: vi.fn(() => ({ role: 'tenant-user', username: 'testuser', tenantId: 'tenant-1' })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const diskImageFixture = create(DiskImageSchema, {
  id: 'di-1',
  metadata: { name: 'rhel-9' },
  spec: {
    sourceType: SourceType.REGISTRY,
    sourceRef: 'quay.io/example/rhel:9',
    guestOsFamily: GuestOSFamily.GUEST_OS_FAMILY_LINUX,
    architecture: [Architecture.AMD64],
  },
});

describe('DiskImageCreatePage', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the create form when there is no :id route param', () => {
    renderWithProviders(<DiskImageCreatePage />, {
      routerEntries: ['/admin/infrastructure/disk-images/create'],
    });

    expect(screen.getByText('Create disk image')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument();
  });

  it('fetches and pre-populates the edit form for a :id route param', async () => {
    renderWithProviders(<DiskImageCreatePage />, {
      routerEntries: ['/admin/infrastructure/disk-images/di-1/edit'],
      routePath: '/admin/infrastructure/disk-images/:id/edit',
      apiFixtures: { diskImages: [diskImageFixture] },
    });

    expect(screen.getByText('Edit disk image')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('rhel-9')).toBeInTheDocument();
    });
    expect(screen.getByText('quay.io/example/rhel:9')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
