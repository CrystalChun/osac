import { createContext, useContext, useLayoutEffect, useState } from 'react';
import type { DemoShellRole } from '@osac/api-contracts/types';

interface SessionContextValue {
  role: DemoShellRole;
  isDarkTheme: boolean;
  username: string;
  setIsDarkTheme: (dark: boolean) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  role: DemoShellRole;
  username: string;
}

export const SessionProvider = ({ children, role, username }: SessionProviderProps) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Theme sync to DOM
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('pf-v6-theme-dark', isDarkTheme);
    root.dataset.osacTheme = isDarkTheme ? 'dark' : 'light';
  }, [isDarkTheme]);

  return role ? (
    <SessionContext.Provider
      value={{
        role,
        isDarkTheme,
        username,
        setIsDarkTheme,
      }}
    >
      {children}
    </SessionContext.Provider>
  ) : undefined;
};

export const useSession = (): SessionContextValue => {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
};
