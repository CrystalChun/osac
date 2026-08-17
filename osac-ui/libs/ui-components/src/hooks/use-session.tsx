import { createContext, useContext } from 'react';

import type { UserRole } from '../shellTypes';
import {
  type Contrast,
  type ResolvedContrast,
  type ResolvedTheme,
  type Theme,
  useTheme,
} from './use-theme';

interface SessionContextValue {
  role: UserRole;
  username: string;
  tenantId: string;
  userTheme: Theme;
  resolvedTheme: ResolvedTheme;
  setUserTheme: (theme: Theme) => void;
  userContrast: Contrast;
  resolvedContrast: ResolvedContrast;
  setUserContrast: (contrast: Contrast) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: React.ReactNode;
  role: UserRole;
  username: string;
  tenantId: string;
}

export const SessionProvider = ({ children, role, username, tenantId }: SessionProviderProps) => {
  const themeProps = useTheme();

  return role ? (
    <SessionContext.Provider
      value={{
        role,
        username,
        tenantId,
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
