import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { CONSOLE_VIEWPORT_CLASS_NAME } from './console-viewport';
import { type VncRfbInstance, loadVncRfbConstructor } from './novnc-rfb';
import { pasteFromClipboard } from './paste-from-clipboard';

import './console-viewport.css';

export interface VmVncConsoleHandle {
  focus: () => void;
  pasteFromClipboard: () => Promise<void>;
}

interface Props {
  className?: string;
  onConnected?: () => void;
  onError?: (message: string) => void;
  webSocket: WebSocket | null;
}

/** How long to wait for a non-zero viewport before giving up on RFB init. */
export const RFB_INIT_TIMEOUT_MS = 30_000;
/** How long to wait for noVNC `connect` after RFB is constructed. */
export const RFB_CONNECT_TIMEOUT_MS = 30_000;

const VmVncConsole = forwardRef<VmVncConsoleHandle, Props>(
  ({ className, onConnected, onError, webSocket }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rfbRef = useRef<VncRfbInstance | undefined>(undefined);

    useImperativeHandle(ref, () => ({
      focus: () => {
        rfbRef.current?.focus();
      },
      pasteFromClipboard: async () => {
        const rfb = rfbRef.current;
        if (rfb) {
          await pasteFromClipboard(rfb, () => rfbRef.current === rfb);
        }
      },
    }));

    useEffect(() => {
      if (!containerRef.current || !webSocket) {
        return;
      }

      const container = containerRef.current;
      let mounted = true;
      let initInFlight = false;
      let connectTimeoutId: number | undefined;
      const onConnect = () => {
        if (!mounted) {
          return;
        }
        window.clearTimeout(connectTimeoutId);
        // Focus so keyboard input goes to the guest without an extra click.
        rfbRef.current?.focus();
        onConnected?.();
      };
      const onDisconnect = () => {
        if (!mounted) {
          return;
        }
        window.clearTimeout(connectTimeoutId);
        onError?.('Graphical console disconnected before it finished connecting');
      };

      const initRfb = async () => {
        if (
          !mounted ||
          initInFlight ||
          rfbRef.current ||
          container.clientWidth === 0 ||
          container.clientHeight === 0
        ) {
          return;
        }

        initInFlight = true;
        try {
          const RFB = await loadVncRfbConstructor();
          if (
            !mounted ||
            rfbRef.current ||
            container.clientWidth === 0 ||
            container.clientHeight === 0
          ) {
            return;
          }

          window.clearTimeout(initTimeoutId);
          const rfb = new RFB(container, webSocket);
          rfb.scaleViewport = true;
          rfb.background = 'rgb(40, 40, 40)';
          rfb.addEventListener('connect', onConnect);
          rfb.addEventListener('disconnect', onDisconnect);
          rfbRef.current = rfb;
          connectTimeoutId = window.setTimeout(() => {
            if (!mounted || rfbRef.current !== rfb) {
              return;
            }
            onError?.('Timed out waiting for the graphical console to finish connecting');
          }, RFB_CONNECT_TIMEOUT_MS);
        } catch (error: unknown) {
          if (!mounted) {
            return;
          }

          window.clearTimeout(initTimeoutId);
          const message =
            error instanceof Error ? error.message : 'Failed to load graphical console viewer';
          onError?.(message);
        } finally {
          initInFlight = false;
        }
      };

      const initTimeoutId = window.setTimeout(() => {
        if (!mounted || rfbRef.current) {
          return;
        }
        onError?.('Graphical console viewer could not start because the display area has no size');
      }, RFB_INIT_TIMEOUT_MS);

      void initRfb();
      const resizeObserver = new ResizeObserver(() => {
        void initRfb();
        if (rfbRef.current) {
          window.dispatchEvent(new Event('resize'));
        }
      });
      resizeObserver.observe(container);

      return () => {
        mounted = false;
        window.clearTimeout(initTimeoutId);
        window.clearTimeout(connectTimeoutId);
        resizeObserver.disconnect();
        rfbRef.current?.removeEventListener('connect', onConnect);
        rfbRef.current?.removeEventListener('disconnect', onDisconnect);
        rfbRef.current?.disconnect();
        rfbRef.current = undefined;
      };
    }, [onConnected, onError, webSocket]);

    const rootClassName = [CONSOLE_VIEWPORT_CLASS_NAME, className].filter(Boolean).join(' ');

    return <div ref={containerRef} className={rootClassName} data-testid="vm-vnc-console" />;
  },
);

VmVncConsole.displayName = 'VmVncConsole';

export default VmVncConsole;
