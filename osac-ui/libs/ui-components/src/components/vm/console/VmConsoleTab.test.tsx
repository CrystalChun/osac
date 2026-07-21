import { type Ref, forwardRef, useImperativeHandle } from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState } from '@osac/types';

import { CONSOLE_FULLSCREEN_CONTAINER_CLASS_NAME } from './console-viewport';
import VmConsoleTab from './VmConsoleTab';
import type { VmVncConsoleHandle } from './VmVncConsole';
import { renderWithProviders } from '../../../test-utils/TestProviders';

vi.mock('./useConsoleSession', () => ({
  useConsoleSession: vi.fn(),
}));

const focusViewer = vi.fn();
let latestOnConnected: (() => void) | undefined;
const MockVmVncConsole = forwardRef(
  (props: { onConnected?: () => void }, ref: Ref<VmVncConsoleHandle>) => {
    latestOnConnected = props.onConnected;
    useImperativeHandle(ref, () => ({
      focus: focusViewer,
      pasteFromClipboard: () => Promise.resolve(),
    }));
    return <div>VNC viewer</div>;
  },
);
MockVmVncConsole.displayName = 'MockVmVncConsole';

vi.mock('./VmVncConsole', () => ({
  default: MockVmVncConsole,
}));

const { useConsoleSession } = await import('./useConsoleSession');

const runningVm = {
  id: 'vm-1',
  status: { state: ComputeInstanceState.RUNNING },
} as ComputeInstance;

const stoppedVm = {
  id: 'vm-1',
  status: { state: ComputeInstanceState.STOPPED },
} as ComputeInstance;

const renderTab = (vm: ComputeInstance) => renderWithProviders(<VmConsoleTab vm={vm} />);

describe('VmConsoleTab', () => {
  beforeEach(() => {
    latestOnConnected = undefined;
    focusViewer.mockClear();
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'idle',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: null,
    });
  });

  it('shows an empty state when the VM is not running', () => {
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'idle',
      errorMessage: null,
      isVmRunning: false,
      reportViewerError: vi.fn(),
      webSocket: null,
    });

    renderTab(stoppedVm);

    expect(screen.getByRole('heading', { name: 'Console unavailable' })).toBeInTheDocument();
    expect(
      screen.getByText('The console is available when the virtual machine is running.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Connecting')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Full screen' })).not.toBeInTheDocument();
  });

  it('shows connection error details', () => {
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'error',
      errorMessage: 'WebSocket closed before the console connected (code 1006)',
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: null,
    });

    renderTab(runningVm);

    expect(screen.getByText('Console connection failed')).toBeInTheDocument();
    expect(
      screen.getByText('WebSocket closed before the console connected (code 1006)'),
    ).toBeInTheDocument();
  });

  it('enables full screen only when the console is connected', () => {
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'connected',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: {} as WebSocket,
    });

    renderTab(runningVm);

    expect(screen.getByRole('button', { name: 'Full screen' })).toBeEnabled();
  });

  it('requests fullscreen on the console container element', async () => {
    const user = userEvent.setup();
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'connected',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: {} as WebSocket,
    });

    renderTab(runningVm);

    const container = document.querySelector(`.${CONSOLE_FULLSCREEN_CONTAINER_CLASS_NAME}`);
    expect(container).toBeInstanceOf(HTMLElement);

    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    (container as HTMLElement).requestFullscreen = requestFullscreen;

    await user.click(screen.getByRole('button', { name: 'Full screen' }));

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('disables full screen while the console is not connected', () => {
    renderTab(runningVm);

    expect(screen.getByRole('button', { name: 'Full screen' })).toBeDisabled();
  });

  it('keeps showing the connecting empty state until the viewer reports it has connected', () => {
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'connected',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: {} as WebSocket,
    });

    renderTab(runningVm);

    expect(screen.getByText('Connecting')).toBeInTheDocument();

    act(() => {
      latestOnConnected?.();
    });

    expect(screen.queryByText('Connecting')).not.toBeInTheDocument();
    expect(focusViewer).toHaveBeenCalled();
  });

  it('shows the connecting empty state while disconnected (no blank viewport)', () => {
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'disconnected',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: null,
    });

    renderTab(runningVm);

    expect(screen.getByRole('heading', { name: 'Connecting' })).toBeInTheDocument();
    expect(screen.queryByText('VNC viewer')).not.toBeInTheDocument();
  });

  it('refocuses the VNC viewer after entering fullscreen', async () => {
    const user = userEvent.setup();
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'connected',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: {} as WebSocket,
    });

    renderTab(runningVm);
    act(() => {
      latestOnConnected?.();
    });
    focusViewer.mockClear();

    const container = document.querySelector(`.${CONSOLE_FULLSCREEN_CONTAINER_CLASS_NAME}`);
    expect(container).toBeInstanceOf(HTMLElement);
    (container as HTMLElement).requestFullscreen = vi.fn().mockImplementation(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        get: () => container,
      });
    });

    await user.click(screen.getByRole('button', { name: 'Full screen' }));
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(focusViewer).toHaveBeenCalled();
  });

  it('passes a stable onConnected callback to the viewer across parent re-renders', () => {
    vi.mocked(useConsoleSession).mockReturnValue({
      connectionState: 'connected',
      errorMessage: null,
      isVmRunning: true,
      reportViewerError: vi.fn(),
      webSocket: {} as WebSocket,
    });

    const { rerender } = renderTab(runningVm);

    const firstOnConnected = latestOnConnected;

    // Simulates an unrelated parent re-render (e.g. VM details polling) with a new vm reference.
    rerender(<VmConsoleTab vm={{ ...runningVm }} />);

    expect(latestOnConnected).toBe(firstOnConnected);
  });
});
