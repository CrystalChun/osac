/**
 * Minimal VM row shape for list/power UX — wire `@osac/types` rows and client overlays.
 */
export type VmRow = {
  id: string;
  metadata?: { name?: string };
  status?: { state?: unknown };
  spec?: Record<string, unknown>;
};
