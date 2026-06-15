import * as React from 'react';

import { useUserPreferences } from './use-user-preferences';

export const THEME_LOCAL_STORAGE_KEY = 'osac/theme';

const THEME_DARK_CLASS = 'pf-v6-theme-dark';

export type Theme = 'dark' | 'light' | 'system';
export type ResolvedTheme = Exclude<Theme, 'system'>;

const getTheme = (storageTheme: string | null): Theme => {
  switch (storageTheme) {
    case 'dark': {
      return 'dark';
    }
    case 'light': {
      return 'light';
    }
    default: {
      return 'system';
    }
  }
};

const getDarkThemeMq = () => window.matchMedia('(prefers-color-scheme: dark)');

const getResolvedTheme = (darkThemeMq: MediaQueryList, theme: string | null): ResolvedTheme => {
  const isDarkPreferred = darkThemeMq.matches;
  return theme === 'dark' || (isDarkPreferred && getTheme(theme) === 'system') ? 'dark' : 'light';
};

export const updateThemeClass = (htmlTagElement: HTMLElement, resolvedTheme: ResolvedTheme) => {
  if (resolvedTheme === 'dark') {
    htmlTagElement.classList.add(THEME_DARK_CLASS);
  } else {
    htmlTagElement.classList.remove(THEME_DARK_CLASS);
  }
};

export const useTheme = () => {
  const htmlTagElement = document.documentElement;
  const [userTheme, setUserTheme] = useUserPreferences(THEME_LOCAL_STORAGE_KEY);
  const [resolvedTheme, setResolvedTheme] = React.useState<ResolvedTheme>('light');

  React.useEffect(() => {
    const currentTheme = getTheme(userTheme);
    const mqListener = (e: MediaQueryListEvent) => {
      const newResolvedTheme: ResolvedTheme = e.matches ? 'dark' : 'light';
      updateThemeClass(htmlTagElement, newResolvedTheme);
      setResolvedTheme(newResolvedTheme);
    };
    const darkThemeMq = getDarkThemeMq();
    const actualTheme = getResolvedTheme(darkThemeMq, userTheme);
    updateThemeClass(htmlTagElement, actualTheme);
    if (currentTheme === 'system') {
      darkThemeMq.addEventListener('change', mqListener);
    }
    setResolvedTheme(actualTheme);

    return () => {
      if (currentTheme === 'system') {
        darkThemeMq.removeEventListener('change', mqListener);
      }
    };
  }, [htmlTagElement, userTheme]);

  const setThemeState = React.useCallback(
    (theme: Theme) => {
      const darkTheme = getDarkThemeMq();
      const actualTheme = getResolvedTheme(darkTheme, theme);
      updateThemeClass(htmlTagElement, actualTheme);
      setUserTheme(theme);
      setResolvedTheme(actualTheme);
    },
    [htmlTagElement, setUserTheme],
  );

  return {
    userTheme: getTheme(userTheme),
    setUserTheme: setThemeState,
    resolvedTheme,
  };
};
