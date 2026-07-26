// @refresh reload — depends on useConsoleSession hook signature
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';
import { ComputeInstanceState, ConsoleResourceType } from '@osac/types';

import { useTranslation } from '../../../hooks/useTranslation';
import {
  CONSOLE_CONNECTING_OVERLAY_CLASS_NAME,
  CONSOLE_FULLSCREEN_CONTAINER_CLASS_NAME,
  CONSOLE_FULLSCREEN_STACK_CLASS_NAME,
  CONSOLE_STACK_CLASS_NAME,
  CONSOLE_VIEWPORT_HIDDEN_CLASS_NAME,
} from '../../Console/console-viewport';
import ConsoleToolbar from '../../Console/ConsoleToolbar';
import { loadVncRfbConstructor } from '../../Console/novnc-rfb';
import { useConsoleFullscreen } from '../../Console/useConsoleFullscreen';
import { useConsoleSession } from '../../Console/useConsoleSession';
import VncConsoleViewer, { type VncConsoleViewerHandle } from '../../Console/VncConsoleViewer';
import QueryErrorState from '../../Resource/QueryErrorState';

import '../../Console/console-viewport.css';

interface Props {
  vm: ComputeInstance;
}

const VmConsoleTab = ({ vm }: Props) => {
  const { t } = useTranslation();
  const { containerRef, isFullscreen, toggleFullscreen } = useConsoleFullscreen();
  const isVmRunning = vm.status?.state === ComputeInstanceState.RUNNING;
  const {
    connectionState,
    connect,
    errorMessage,
    errorKind,
    reportViewerError,
    takeOver,
    webSocket,
  } = useConsoleSession({
    resourceType: ConsoleResourceType.COMPUTE_INSTANCE,
    resourceId: vm.id,
    isRunning: isVmRunning,
  });
  const vncRef = useRef<VncConsoleViewerHandle>(null);
  // Compare by socket identity: leaving the tab unmounts and resets state, but while
  // mounted the session hook can replace webSocket (e.g. VM stop→start) without
  // remounting — keep "Connecting" until noVNC reports ready for that new socket.
  const [viewerReadySocket, setViewerReadySocket] = useState<WebSocket>();
  const isViewerConnected = viewerReadySocket === webSocket;

  const handleViewerConnected = useCallback(() => {
    if (webSocket) {
      setViewerReadySocket(webSocket);
    }
  }, [webSocket]);

  // Loads the noVNC viewer code before ever creating the session/socket, so that by the
  // time the socket exists and VncConsoleViewer mounts, `new RFB(...)` can attach its
  // listeners immediately — before the socket's real network-bound 'open' event has any
  // chance to fire. Otherwise the VNC backend's first bytes (sent the instant the socket
  // opens) could arrive before the dynamic import resolves and get dropped with nothing
  // yet listening, stalling the connection until VncConsoleViewer's own timeout gives up. This
  // effect never calls connect() itself when isVmRunning is false, and always cancels a
  // stale load if superseded (isVmRunning flips, or the tab unmounts) — including a React
  // StrictMode phantom mount, whose synchronous cleanup always runs before this promise
  // resolves, since a dynamic import is never synchronous.
  useEffect(() => {
    if (!isVmRunning) {
      return;
    }

    let cancelled = false;
    const loadThenConnect = async () => {
      try {
        await loadVncRfbConstructor();
        if (!cancelled) {
          connect();
        }
      } catch (error) {
        if (!cancelled) {
          reportViewerError(
            error instanceof Error ? error.message : 'Failed to load graphical console viewer',
          );
        }
      }
    };
    void loadThenConnect();

    return () => {
      cancelled = true;
    };
  }, [connect, isVmRunning, reportViewerError]);

  // Restore keyboard focus after connect and after entering fullscreen (the Full
  // screen button otherwise keeps focus, so typing would not reach the guest).
  useEffect(() => {
    if (!isViewerConnected) {
      return;
    }
    vncRef.current?.focus();
  }, [isFullscreen, isViewerConnected]);

  if (!isVmRunning) {
    return (
      <Bullseye className={CONSOLE_STACK_CLASS_NAME}>
        <EmptyState headingLevel="h2" titleText={t('Console unavailable')}>
          <EmptyStateBody>
            {t('The console is available when the virtual machine is running.')}
          </EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  const connecting = (
    <Bullseye className={CONSOLE_CONNECTING_OVERLAY_CLASS_NAME}>
      <EmptyState titleText={t('Connecting')} icon={Spinner} headingLevel="h3">
        <EmptyStateBody>{t('Establishing console connection...')}</EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );

  let viewport: ReactNode;
  if (connectionState === 'error') {
    // Take over only ever sends this browser's persisted client id — exactly what a plain
    // reconnect already sends — so it can only change the outcome when the conflicting
    // session was created with that same id, i.e. by this same browser. That is only
    // confirmed for 'siblingTabConflict'; every other error (including a merely *possible*
    // conflict) offers no action, since there is nothing takeOver could do differently.
    const canTakeOver = errorKind === 'siblingTabConflict';
    viewport = (
      <QueryErrorState
        error={errorMessage}
        title={t('Console connection failed')}
        secondaryAction={canTakeOver ? { label: t('Take over'), onClick: takeOver } : undefined}
      />
    );
  } else if (!webSocket) {
    viewport = connecting;
  } else {
    viewport = (
      <>
        <VncConsoleViewer
          ref={vncRef}
          className={isViewerConnected ? undefined : CONSOLE_VIEWPORT_HIDDEN_CLASS_NAME}
          onConnected={handleViewerConnected}
          onError={reportViewerError}
          webSocket={webSocket}
        />
        {!isViewerConnected && connecting}
      </>
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        {/* Plain div: Fullscreen API needs a real DOM node; PF Stack is not forwardRef. */}
        <div ref={containerRef} className={CONSOLE_FULLSCREEN_CONTAINER_CLASS_NAME}>
          <Stack hasGutter className={CONSOLE_FULLSCREEN_STACK_CLASS_NAME}>
            <StackItem>
              <ConsoleToolbar
                connectionState={connectionState}
                isFullscreen={isFullscreen}
                onPaste={() => void vncRef.current?.pasteFromClipboard()}
                onToggleFullscreen={() => void toggleFullscreen()}
              />
            </StackItem>
            <StackItem isFilled className={CONSOLE_STACK_CLASS_NAME}>
              {viewport}
            </StackItem>
          </Stack>
        </div>
      </StackItem>
    </Stack>
  );
};

export default VmConsoleTab;
