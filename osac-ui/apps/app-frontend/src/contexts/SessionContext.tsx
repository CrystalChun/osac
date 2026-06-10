import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { DemoShellRole, DemoTenantId } from '@osac/api-contracts/types';

// ---------------------------------------------------------------------------
// Query-param helpers (run once at startup)
// ---------------------------------------------------------------------------

const readOsacEntry = (): { tenant: DemoTenantId; role: DemoShellRole } | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const p = new URLSearchParams(window.location.search);
  const raw = p.get('osac-entry')?.trim().toLowerCase() ?? '';
  const map: Record<string, { tenant: DemoTenantId; role: DemoShellRole }> = {
    'northstar-user': { tenant: 'northstar', role: 'tenantUser' },
    'northstar-admin': { tenant: 'northstar', role: 'tenantAdmin' },
    'evergreen-user': { tenant: 'evergreen', role: 'tenantUser' },
    'evergreen-admin': { tenant: 'evergreen', role: 'tenantAdmin' },
  };
  return map[raw] ?? null;
};

const PERSONA_STORAGE_KEY = 'osac.persona';

const savePersonaToStorage = (tenant: DemoTenantId | null, role: DemoShellRole) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (tenant) {
    sessionStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify({ tenant, role }));
  } else {
    sessionStorage.removeItem(PERSONA_STORAGE_KEY);
  }
};

const loadPersonaFromStorage = (): { tenant: DemoTenantId; role: DemoShellRole } | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(PERSONA_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as { tenant: DemoTenantId; role: DemoShellRole };
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Auth API helpers
// ---------------------------------------------------------------------------

const EXPIRATION_KEY = 'osac.sessionExpiry';

const fetchLoginInfo = async (): Promise<{ username: string } | null> => {
  try {
    const resp = await fetch('/api/login/info', { credentials: 'include' });
    if (resp.status === 401) {
      return null;
    }
    if (!resp.ok) {
      return null;
    }
    return (await resp.json()) as { username: string };
  } catch {
    return null;
  }
};

const fetchRefresh = async (): Promise<{ expiresIn: number } | null> => {
  try {
    const resp = await fetch('/api/login/refresh', { credentials: 'include' });
    if (!resp.ok) {
      return null;
    }
    return (await resp.json()) as { expiresIn: number };
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

export interface TopologyVmDetailRequest {
  vmId: string;
  seq: number;
}

interface SessionContextValue {
  selectedTenant: DemoTenantId | null;
  role: DemoShellRole;
  isLoggedIn: boolean;
  isAuthLoading: boolean;
  isDarkTheme: boolean;
  topologyDetailRequest: TopologyVmDetailRequest | null;
  username: string | null;
  // Actions
  /** Called by AuthCallback after the proxy sets the session cookie. */
  onLoginComplete: (expiresIn: number) => Promise<void>;
  logout: () => Promise<void>;
  setIsDarkTheme: (dark: boolean) => void;
  openTopologyDetailRequest: (vmId: string) => void;
  clearTopologyDetailRequest: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface SessionProviderProps {
  children: React.ReactNode;
  onNavigateAfterLogin: (role: DemoShellRole) => void;
  onNavigateToWelcome: () => void;
}

export const SessionProvider = ({
  children,
  onNavigateAfterLogin,
  onNavigateToWelcome,
}: SessionProviderProps) => {
  const osacEntry = useRef(readOsacEntry());

  const storedPersona = loadPersonaFromStorage();
  const initialPersona = osacEntry.current ?? storedPersona;

  const [selectedTenant, setSelectedTenant] = useState<DemoTenantId | null>(
    () => initialPersona?.tenant ?? null,
  );
  const [role, setRole] = useState<DemoShellRole>(() => initialPersona?.role ?? 'tenantUser');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [topologyDetailRequest, setTopologyDetailRequest] =
    useState<TopologyVmDetailRequest | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remove osac-entry from URL on first render (persona already captured in ref above).
  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const p = new URLSearchParams(window.location.search);
    if (!p.has('osac-entry')) {
      return;
    }
    p.delete('osac-entry');
    const qs = p.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, []);

  // Theme sync to DOM
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('pf-v6-theme-dark', isDarkTheme);
    root.dataset.osacTheme = isDarkTheme ? 'dark' : 'light';
  }, [isDarkTheme]);

  // On mount: check if there is an existing session (e.g. page reload).
  useEffect(() => {
    void fetchLoginInfo().then((info) => {
      if (info) {
        setIsLoggedIn(true);
        setUsername(info.username);
        // Restore persona from storage if the user reloaded the page.
        const saved = loadPersonaFromStorage();
        if (saved && !selectedTenant) {
          setSelectedTenant(saved.tenant);
          setRole(saved.role);
        }
      }
      setIsAuthLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    if (expiresIn <= 0) {
      return;
    }
    // Refresh 30 seconds before expiry; minimum 5 seconds.
    const delay = Math.max((expiresIn - 30) * 1000, 5000);
    refreshTimerRef.current = setTimeout(() => {
      void fetchRefresh().then((result) => {
        if (result) {
          sessionStorage.setItem(EXPIRATION_KEY, String(Date.now() + result.expiresIn * 1000));
          scheduleRefresh(result.expiresIn);
        }
      });
    }, delay);
  }, []);

  const onLoginComplete = useCallback(
    async (expiresIn: number) => {
      const info = await fetchLoginInfo();
      if (info) {
        setIsLoggedIn(true);
        setUsername(info.username);
        sessionStorage.setItem(EXPIRATION_KEY, String(Date.now() + expiresIn * 1000));
        scheduleRefresh(expiresIn);
        onNavigateAfterLogin(role);
      }
    },
    [role, onNavigateAfterLogin, scheduleRefresh],
  );

  const logout = useCallback(async () => {
    const resp = await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    if (!resp.ok) {
      let text = '';
      try {
        text = await resp.text();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to parse logout response', e);
      }
      throw new Error(`Logout failed (HTTP ${resp.status})${text ? `: ${text}` : ''}`);
    }
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    sessionStorage.removeItem(EXPIRATION_KEY);
    savePersonaToStorage(null, 'tenantUser');
    setIsLoggedIn(false);
    setUsername(null);
    setSelectedTenant(null);
    setRole('tenantUser');
    setTopologyDetailRequest(null);
    onNavigateToWelcome();
  }, [onNavigateToWelcome]);

  const openTopologyDetailRequest = useCallback((vmId: string) => {
    setTopologyDetailRequest((prev) => ({ vmId, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const clearTopologyDetailRequest = useCallback(() => setTopologyDetailRequest(null), []);

  return (
    <SessionContext.Provider
      value={{
        selectedTenant,
        role,
        isLoggedIn,
        isAuthLoading,
        isDarkTheme,
        topologyDetailRequest,
        username,
        onLoginComplete,
        logout,
        setIsDarkTheme,
        openTopologyDetailRequest,
        clearTopologyDetailRequest,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
};
