// @refresh reload — depends on useConsoleSession hook signature
import { type ReactNode, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';

import type { ComputeInstance } from '@osac/types';

import {
  CONSOLE_CONNECTING_OVERLAY_CLASS_NAME,
  CONSOLE_FULLSCREEN_CONTAINER_CLASS_NAME,
  CONSOLE_FULLSCREEN_STACK_CLASS_NAME,
  CONSOLE_STACK_CLASS_NAME,
  CONSOLE_VIEWPORT_HIDDEN_CLASS_NAME,
} from './console-viewport';
import { useConsoleFullscreen } from './useConsoleFullscreen';
import { useConsoleSession } from './useConsoleSession';
import VmConsoleToolbar from './VmConsoleToolbar';
import type { VmVncConsoleHandle } from './VmVncConsole';
import { useTranslation } from '../../../hooks/useTranslation';
import QueryErrorState from '../../Resource/QueryErrorState';

import './console-viewport.css';

const VmVncConsole = lazy(() => import('./VmVncConsole'));

interface Props {
  vm: ComputeInstance;
}

const VmConsoleTab = ({ vm }: Props) => {
  const { t } = useTranslation();
  const { containerRef, isFullscreen, toggleFullscreen } = useConsoleFullscreen();
  const { connectionState, errorMessage, isVmRunning, reportViewerError, webSocket } =
    useConsoleSession(vm, 'vnc');
  const vncRef = useRef<VmVncConsoleHandle>(null);
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
    viewport = <QueryErrorState error={errorMessage} title={t('Console connection failed')} />;
  } else if (!webSocket || connectionState !== 'connected') {
    viewport = connecting;
  } else {
    const viewer = (
      <Suspense fallback={connecting}>
        <VmVncConsole
          ref={vncRef}
          className={isViewerConnected ? undefined : CONSOLE_VIEWPORT_HIDDEN_CLASS_NAME}
          onConnected={handleViewerConnected}
          onError={reportViewerError}
          webSocket={webSocket}
        />
      </Suspense>
    );
    viewport = isViewerConnected ? (
      viewer
    ) : (
      <>
        {viewer}
        {connecting}
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
              <VmConsoleToolbar
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
