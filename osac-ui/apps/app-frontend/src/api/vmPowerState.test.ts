import { describe, expect, it } from 'vitest';

import {
  COMPUTE_INSTANCE_STATE,
  isTransitionDisplayState,
} from '@osac/ui-components/vmDisplayState';

describe('isTransitionDisplayState', () => {
  it('returns true for transition and client-only states', () => {
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.STARTING)).toBe(true);
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.STOPPING)).toBe(true);
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.DELETING)).toBe(true);
    expect(isTransitionDisplayState('restarting')).toBe(true);
  });

  it('returns false for stable states', () => {
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.RUNNING)).toBe(false);
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.STOPPED)).toBe(false);
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.PAUSED)).toBe(false);
    expect(isTransitionDisplayState(COMPUTE_INSTANCE_STATE.FAILED)).toBe(false);
  });
});
