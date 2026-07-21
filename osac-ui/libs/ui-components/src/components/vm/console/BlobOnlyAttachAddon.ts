import type { ITerminalAddon, Terminal } from '@xterm/xterm';

const writeSocketData = async (terminal: Terminal, data: Blob | ArrayBuffer | string) => {
  if (typeof data === 'string') {
    terminal.write(data);
    return;
  }

  if (data instanceof Blob) {
    terminal.write(new Uint8Array(await data.arrayBuffer()));
    return;
  }

  terminal.write(new Uint8Array(data));
};

export class BlobOnlyAttachAddon implements ITerminalAddon {
  private terminal?: Terminal;
  private dataDisposable?: { dispose: () => void };
  private readonly messageListener: (event: MessageEvent) => void;

  constructor(private readonly socket: WebSocket) {
    this.messageListener = (event: MessageEvent) => {
      if (!this.terminal) {
        return;
      }

      void writeSocketData(this.terminal, event.data as Blob | ArrayBuffer | string);
    };
  }

  activate(terminal: Terminal): void {
    this.terminal = terminal;
    this.socket.binaryType = 'arraybuffer';
    this.socket.addEventListener('message', this.messageListener);
    this.dataDisposable = terminal.onData((data) => {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(data);
      }
    });
  }

  dispose(): void {
    this.socket.removeEventListener('message', this.messageListener);
    this.dataDisposable?.dispose();
    this.terminal = undefined;
  }
}
