import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Protocol, SecurityGroupState, VirtualNetworkState } from '@osac/types';

import { SecurityGroupDetailPage } from './SecurityGroupDetailPage';
import * as networkingApi from '../../api/v1/networking';

vi.mock('../../api/v1/networking', async (importOriginal) => {
  const actual = await importOriginal<typeof networkingApi>();
  return {
    ...actual,
    useSecurityGroup: vi.fn(),
    useVirtualNetworks: vi.fn(),
    useUpdateSecurityGroup: vi.fn(),
  };
});

describe('SecurityGroupDetailPage', () => {
  const mockVirtualNetworks = [
    {
      id: 'vn-1',
      metadata: { name: 'vn-prod' },
      spec: { ipv4Cidr: '10.0.0.0/16' },
      status: { state: VirtualNetworkState.READY },
    },
  ];

  const mockSecurityGroup = {
    id: 'sg-1',
    metadata: { name: 'sg-web' },
    spec: {
      virtualNetwork: 'vn-1',
      ingress: [
        { protocol: Protocol.TCP, portFrom: 80, portTo: 80, ipv4Cidr: '0.0.0.0/0' },
        { protocol: Protocol.TCP, portFrom: 443, portTo: 443, ipv4Cidr: '0.0.0.0/0' },
      ],
      egress: [{ protocol: Protocol.ALL }],
    },
    status: { state: SecurityGroupState.READY },
  };

  beforeEach(() => {
    vi.mocked(networkingApi.useSecurityGroup).mockReturnValue({
      data: mockSecurityGroup,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSecurityGroup>);

    vi.mocked(networkingApi.useVirtualNetworks).mockReturnValue({
      data: mockVirtualNetworks,
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useVirtualNetworks>);

    vi.mocked(networkingApi.useUpdateSecurityGroup).mockReturnValue({
      mutateAsync: vi.fn(),
    } as unknown as ReturnType<typeof networkingApi.useUpdateSecurityGroup>);
  });

  it('renders breadcrumb with link to list page', () => {
    render(
      <MemoryRouter initialEntries={['/networking/security-groups/sg-1']}>
        <Routes>
          <Route path="/networking/security-groups/:id" element={<SecurityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /Security groups/i })).toBeInTheDocument();
    expect(screen.getByText('sg-web')).toBeInTheDocument();
  });

  it('renders three tabs: Inbound Rules, Outbound Rules, Details', () => {
    render(
      <MemoryRouter initialEntries={['/networking/security-groups/sg-1']}>
        <Routes>
          <Route path="/networking/security-groups/:id" element={<SecurityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('tab', { name: /Inbound Rules/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Outbound Rules/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Details/i })).toBeInTheDocument();
  });

  it('displays inbound rules in SecurityGroupRulesTable on Inbound Rules tab', () => {
    render(
      <MemoryRouter initialEntries={['/networking/security-groups/sg-1']}>
        <Routes>
          <Route path="/networking/security-groups/:id" element={<SecurityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protocol')).toBeInTheDocument();
    expect(screen.getByText('TCP')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('443')).toBeInTheDocument();
  });

  it('shows FAILED alert when status is FAILED', () => {
    vi.mocked(networkingApi.useSecurityGroup).mockReturnValue({
      data: {
        ...mockSecurityGroup,
        status: { state: SecurityGroupState.FAILED, message: 'Network error' },
      },
      isLoading: false,
      error: null,
    } as ReturnType<typeof networkingApi.useSecurityGroup>);

    render(
      <MemoryRouter initialEntries={['/networking/security-groups/sg-1']}>
        <Routes>
          <Route path="/networking/security-groups/:id" element={<SecurityGroupDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Provisioning failed')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });
});
