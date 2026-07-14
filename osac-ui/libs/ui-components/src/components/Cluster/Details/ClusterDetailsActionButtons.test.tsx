import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClusterState } from '@osac/types';

import ClusterDetailsActionButtons from './ClusterDetailsActionButtons';
import * as clusterApi from '../../../api/v1/cluster';

vi.mock('../../../api/v1/cluster', async (importOriginal) => {
  const actual = await importOriginal<typeof clusterApi>();
  return {
    ...actual,
    useDownloadKubeconfig: vi.fn(),
    useFetchClusterPassword: vi.fn(),
  };
});

const mockCluster = (state: ClusterState) => ({
  id: 'cluster-123',
  metadata: { name: 'my-cluster' },
  status: { state, conditions: [], apiUrl: '', consoleUrl: '', nodeSets: {} },
  spec: { template: '', templateParameters: {}, nodeSets: {}, catalogItem: '' },
});

describe('ClusterDetailsActionButtons', () => {
  const download = vi.fn();
  const setError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clusterApi.useDownloadKubeconfig).mockReturnValue({
      download,
      isPending: false,
      error: undefined,
      setError,
    });
    vi.mocked(clusterApi.useFetchClusterPassword).mockReturnValue({
      isPending: false,
      error: undefined,
      password: undefined,
      retry: vi.fn(),
    });
  });

  const renderButtons = (state: ClusterState = ClusterState.READY) =>
    render(
      <MemoryRouter>
        <ClusterDetailsActionButtons cluster={mockCluster(state)} />
      </MemoryRouter>,
    );

  it('renders download kubeconfig, view password, and delete buttons', () => {
    renderButtons();

    expect(screen.getByRole('button', { name: /Download kubeconfig/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
  });

  it('disables download kubeconfig when cluster is not ready', () => {
    renderButtons(ClusterState.PROGRESSING);

    expect(screen.getByRole('button', { name: /Download kubeconfig/i })).toBeDisabled();
  });

  it('disables view password when cluster is not ready', () => {
    renderButtons(ClusterState.PROGRESSING);

    expect(screen.getByRole('button', { name: /View password/i })).toBeDisabled();
  });

  it('enables download kubeconfig when cluster is ready', () => {
    renderButtons(ClusterState.READY);

    expect(screen.getByRole('button', { name: /Download kubeconfig/i })).toBeEnabled();
  });

  it('enables view password when cluster is ready', () => {
    renderButtons(ClusterState.READY);

    expect(screen.getByRole('button', { name: /View password/i })).toBeEnabled();
  });

  it('calls download when download kubeconfig is clicked', async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole('button', { name: /Download kubeconfig/i }));

    expect(download).toHaveBeenCalledWith('cluster-123', 'my-cluster');
  });

  it('shows error modal with retry on failed kubeconfig download', async () => {
    const user = userEvent.setup();
    vi.mocked(clusterApi.useDownloadKubeconfig).mockReturnValue({
      download,
      isPending: false,
      error: new Error('Network error'),
      setError,
    });
    renderButtons();

    expect(screen.getByText(/Failed to download kubeconfig/i)).toBeInTheDocument();
    expect(screen.getByText(/Network error/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Retry/i }));

    expect(download).toHaveBeenCalledWith('cluster-123', 'my-cluster');
  });

  it('opens password modal when view password is clicked', async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole('button', { name: /View password/i }));

    expect(screen.getByText('Cluster password')).toBeInTheDocument();
  });
});
