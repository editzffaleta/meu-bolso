'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/shared/hooks/use-local-storage.hook';
import { getMessage } from '../i18n';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'meu-bolso:theme';
const DEFAULT_THEME: Theme = 'light';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Script anti-flash: aplica a classe `.dark` no `<html>` antes da hidratação,
 * lendo a preferência persistida em localStorage. Deve ser injetado no <head>
 * do root layout via `dangerouslySetInnerHTML`.
 */
export const THEME_ANTI_FLASH_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var theme=t?JSON.parse(t):'${DEFAULT_THEME}';if(theme==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setStoredTheme] = useLocalStorage<Theme>(THEME_STORAGE_KEY, DEFAULT_THEME);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setStoredTheme(next);
    },
    [setStoredTheme],
  );

  const toggleTheme = useCallback(() => {
    setStoredTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, [setStoredTheme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(getMessage('THEME_CONTEXT_PROVIDER_REQUIRED'));
  }
  return context;
}
