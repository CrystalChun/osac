import React, { type ReactNode, createElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { create } from '@bufbuild/protobuf';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  type Cluster,
  ClusterSchema,
  type ClusterVersion,
  ClusterVersionSchema,
  ClusterVersionState,
} from '@osac/types';

import { ClustersTable } from './ClustersTable';
import { ApiProvider } from '../../api/api-context';
import { createMockConnectTransport } from '../../test-utils/createMockConnectTransport';

const makeCluster = (id: string, versionName: string): Cluster =>
  create(ClusterSchema, {
    id,
    metadata: { name: id },
    spec: { version: { name: versionName } },
  });

const makeClusterVersion = (
  name: string,
  version: string,
  state: ClusterVersionState,
  enabled = true,
): ClusterVersion =>
  create(ClusterVersionSchema, {
    id: name,
    metadata: { name },
    spec: { version, state, enabled },
  });

const renderTable = (props: React.ComponentProps<typeof ClustersTable>) => {
  const transport = createMockConnectTransport();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(
      ApiProvider,
      { transport } as React.ComponentProps<typeof ApiProvider>,
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(MemoryRouter, null, children),
      ),
    );
  return render(<ClustersTable {...props} />, { wrapper });
};

const clusterVersions = [
  makeClusterVersion('v4.17', '4.17.0', ClusterVersionState.ACTIVE),
  makeClusterVersion('v4.16', '4.16.0', ClusterVersionState.DEPRECATED),
  makeClusterVersion('v4.15', '4.15.0', ClusterVersionState.OBSOLETE),
  makeClusterVersion('v4.14', '4.14.0', ClusterVersionState.ACTIVE, false),
];

describe('ClustersTable version join', () => {
  it('renders the resolved version string and lifecycle label for every state', () => {
    renderTable({
      clusters: [
        makeCluster('c-active', 'v4.17'),
        makeCluster('c-deprecated', 'v4.16'),
        makeCluster('c-obsolete', 'v4.15'),
        makeCluster('c-disabled', 'v4.14'),
      ],
      clusterVersions,
    });

    expect(screen.getByText('4.17.0')).toBeInTheDocument();
    expect(screen.getByText('4.16.0')).toBeInTheDocument();
    expect(screen.getByText('4.15.0')).toBeInTheDocument();
    expect(screen.getByText('4.14.0')).toBeInTheDocument();

    // Both the active and the disabled-but-active version render an Active label.
    expect(screen.getAllByText('Active')).toHaveLength(2);
    expect(screen.getByText('Deprecated')).toBeInTheDocument();
    expect(screen.getByText('Obsolete')).toBeInTheDocument();
  });

  it('falls back to the raw reference name with a blank lifecycle when unresolved', () => {
    renderTable({
      clusters: [makeCluster('c-missing', 'v-deleted')],
      clusterVersions,
    });

    expect(screen.getByText('v-deleted')).toBeInTheDocument();
    const lifecycleCell = screen
      .getByText('v-deleted')
      .closest('tr')
      ?.querySelector('[data-label="Lifecycle"]');
    expect(lifecycleCell?.querySelector('.pf-v6-c-label')).toBeNull();
  });

  it('shows skeletons while cluster versions are loading', () => {
    const { container } = renderTable({
      clusters: [makeCluster('c-active', 'v4.17')],
      clusterVersions: [],
      isClusterVersionsLoading: true,
    });

    expect(container.querySelectorAll('.pf-v6-c-skeleton').length).toBeGreaterThan(0);
    expect(screen.queryByText('4.17.0')).toBeNull();
  });
});
