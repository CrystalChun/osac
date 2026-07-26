/** UI connection lifecycle — distinct from protobuf ConsoleConnectionState. */
export type ConsoleUiConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';
