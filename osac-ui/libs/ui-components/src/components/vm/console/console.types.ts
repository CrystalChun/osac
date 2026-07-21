/** UI connection lifecycle — distinct from protobuf ConsoleConnectionState. */
export type ConsoleUiConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

/** Console type selector values — maps to protobuf ConsoleType. */
export type VmConsoleType = 'serial' | 'vnc';

export interface ConsoleSessionParams {
  vmId: string;
  consoleType: VmConsoleType;
  clientId: string;
}
