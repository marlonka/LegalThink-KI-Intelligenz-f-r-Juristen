import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system' | 'midnight' | 'obsidian';

interface ThemeState {
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: ThemeState;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const defaultState: ThemeState = {
  mode: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeState>(() => {
    try {
      const saved = localStorage.getItem('legalthink-theme');
      if (saved) return JSON.parse(saved) as ThemeState;
    } catch (e) {
      console.warn("Failed to parse theme from localStorage", e);
    }
    return defaultState;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (theme.mode === 'dark' || theme.mode === 'midnight' || theme.mode === 'obsidian') return true;
    if (theme.mode === 'system' && typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply theme to document
  useEffect(() => {
    localStorage.setItem('legalthink-theme', JSON.stringify(theme));

    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'theme-midnight', 'theme-obsidian');

    let systemDark = false;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      systemDark = true;
    }

    const appliedTheme = theme.mode === 'system' ? (systemDark ? 'dark' : 'light') : theme.mode;

    if (appliedTheme === 'dark') {
      root.classList.add('dark');
      setIsDark(true);
    } else if (appliedTheme === 'midnight') {
      root.classList.add('dark', 'theme-midnight');
      setIsDark(true);
    } else if (appliedTheme === 'obsidian') {
      root.classList.add('dark', 'theme-obsidian');
      setIsDark(true);
    } else {
      setIsDark(false);
    }

    // Always reset accent color override (gold is the default)
    root.style.removeProperty('--color-firm-accent');
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme.mode === 'system') {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark', 'theme-midnight', 'theme-obsidian');
        if (mediaQuery.matches) {
          root.classList.add('dark');
          setIsDark(true);
        } else {
          setIsDark(false);
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme.mode]);

  const setMode = (mode: ThemeMode) => {
    setTheme((prev) => ({ ...prev, mode }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
