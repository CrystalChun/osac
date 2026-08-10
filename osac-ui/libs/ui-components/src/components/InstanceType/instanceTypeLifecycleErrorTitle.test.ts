import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

import { getInstanceTypeLifecycleErrorTitle } from './instanceTypeLifecycleErrorTitle';

const i18nInstance = i18next.createInstance();
i18nInstance.init({ initImmediate: false, lng: 'en', fallbackLng: 'en', resources: {} });
const t = i18nInstance.t.bind(i18nInstance);

describe('getInstanceTypeLifecycleErrorTitle', () => {
  it('returns the deprecate failure title', () => {
    expect(getInstanceTypeLifecycleErrorTitle(t, 'deprecate')).toBe(
      'Failed to deprecate instance type',
    );
  });

  it('returns the obsolete failure title', () => {
    expect(getInstanceTypeLifecycleErrorTitle(t, 'obsolete')).toBe(
      'Failed to mark instance type as obsolete',
    );
  });

  it('returns the reactivate failure title', () => {
    expect(getInstanceTypeLifecycleErrorTitle(t, 'reactivate')).toBe(
      'Failed to reactivate instance type',
    );
  });
});
