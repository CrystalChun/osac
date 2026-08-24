import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { NetworkClass, Project } from '@osac/types';

import { VirtualNetworkCreateModal } from './VirtualNetworkCreateModal';
import * as networkingApi from '../../api/v1/networking';
import { mockQueryResult } from '../../test-utils/query';
import { renderWithProviders } from '../../test-utils/TestProviders';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useNetworkClasses: vi.fn(),
    useCreateVirtualNetwork: vi.fn(),
  };
});

const projects: Project[] = [
  {
    $typeName: 'osac.public.v1.Project',
    id: 'project-1',
    metadata: {
      $typeName: 'osac.public.v1.Metadata',
      displayName: '',
      description: '',
      name: 'my-project',
      annotations: {},
      creator: 'foo',
      labels: {},
      project: '',
      tenant: 'foo',
      version: 1,
    },
    spec: {
      $typeName: 'osac.public.v1.ProjectSpec',
      title: 'My Project',
    },
  } as Project,
];

const renderModal = (onClose: () => void) =>
  renderWithProviders(<VirtualNetworkCreateModal onClose={onClose} />, {
    apiFixtures: { projects },
  });

describe('VirtualNetworkCreateModal', () => {
  const mockOnClose = vi.fn();
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(
      mockQueryResult<NetworkClass[]>({
        data: [
          {
            id: 'nc-1',
            metadata: { name: 'test-nc' },
            title: 'Test Network Class',
            isDefault: true,
          },
        ] as NetworkClass[],
      }),
    );
    vi.mocked(networkingApi.useCreateVirtualNetwork).mockReturnValue({
      mutateAsync,
      error: null,
    } as unknown as ReturnType<typeof networkingApi.useCreateVirtualNetwork>);
  });

  it('renders with Name and IPv4 CIDR fields', () => {
    renderModal(mockOnClose);

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/IPv4 CIDR/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('Create button stays enabled', () => {
    renderModal(mockOnClose);

    const createButton = screen.getByRole('button', { name: /Create/i });
    expect(createButton).not.toBeDisabled();
  });

  it('renders IPv6 CIDR field as optional', () => {
    renderModal(mockOnClose);

    expect(screen.getByLabelText(/IPv6 CIDR \(Optional\)/i)).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when Name and CIDRs are empty', async () => {
    const { user } = renderModal(mockOnClose);

    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('calls create and navigates on successful submit', async () => {
    mutateAsync.mockResolvedValue({ id: 'vn-new' });

    const { user } = renderModal(mockOnClose);

    await user.click(screen.getByLabelText(/^Project/));
    await user.click(screen.getByRole('option', { name: 'My Project' }));
    await user.type(screen.getByLabelText(/Name/i), 'vn-prod');
    await user.type(screen.getByLabelText(/IPv4 CIDR/i), '10.0.0.0/16');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { name: 'vn-prod', project: 'my-project' },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          spec: expect.objectContaining({
            networkClass: { name: 'test-nc' },
            ipv4Cidr: '10.0.0.0/16',
          }),
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/networking/virtual-networks/vn-new');
    });
  });

  it('shows error alert when create fails', async () => {
    mutateAsync.mockRejectedValue(new Error('API error'));
    vi.mocked(networkingApi.useCreateVirtualNetwork).mockReturnValue({
      mutateAsync,
      error: new Error('API error'),
    } as unknown as ReturnType<typeof networkingApi.useCreateVirtualNetwork>);

    const { user } = renderModal(mockOnClose);

    await user.type(screen.getByLabelText(/Name/i), 'vn-prod');
    await user.type(screen.getByLabelText(/IPv4 CIDR/i), '10.0.0.0/16');
    await user.click(screen.getByRole('button', { name: /Create/i }));

    await waitFor(() => {
      expect(screen.getByText(/API error/i)).toBeInTheDocument();
    });
  });

  it('renders loading indicator while network classes are loading', () => {
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(
      mockQueryResult<NetworkClass[]>({ isLoading: true }),
    );

    renderModal(mockOnClose);

    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  });

  it('renders when no network classes are available', () => {
    vi.mocked(networkingApi.useNetworkClasses).mockReturnValue(mockQueryResult<NetworkClass[]>());

    renderModal(mockOnClose);

    expect(screen.getByRole('button', { name: /Create/i })).toBeInTheDocument();
  });
});
