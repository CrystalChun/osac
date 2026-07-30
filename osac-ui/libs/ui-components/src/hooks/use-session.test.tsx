import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SessionProvider, useSession } from './use-session';

describe('useSession', () => {
  it('exposes tenantId from provider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider role="tenant-user" username="alice" tenantId="t-123">
        {children}
      </SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.tenantId).toBe('t-123');
    expect(result.current.username).toBe('alice');
    expect(result.current.role).toBe('tenant-user');
  });

  it('exposes an empty tenantId when provider receives an empty string', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SessionProvider role="admin" username="bob" tenantId="">
        {children}
      </SessionProvider>
    );

    const { result } = renderHook(() => useSession(), { wrapper });

    expect(result.current.tenantId).toBe('');
  });

  it('throws when used outside SessionProvider', () => {
    expect(() => {
      renderHook(() => useSession());
    }).toThrow('useSession must be used inside SessionProvider');
  });
});
