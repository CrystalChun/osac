import { createContext, useContext } from 'react';

import type { DemoShellRole } from '../shellTypes';
import { type ResolvedTheme, type Theme, useTheme } from './use-theme';

interface SessionContextValue {
  role: DemoShellRole;
  username: string;
  userTheme: Theme;
  resolvedTheme: ResolvedTheme;
  setUserTheme: (theme: Theme) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  role: DemoShellRole;
  username: string;
}

export const SessionProvider = ({ children, role, username }: SessionProviderProps) => {
  const themeProps = useTheme();

  return role ? (
    <SessionContext.Provider
      value={{
        role,
        username,
        ...themeProps,
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
