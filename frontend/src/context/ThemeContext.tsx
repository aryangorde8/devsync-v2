'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { portfolioApi } from '@/lib/portfolio';
import { useAuth } from './AuthContext';

type ColorMode = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface ThemeContextType {
  colors: ThemeColors;
  colorMode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
  isLoading: boolean;
  refreshTheme: () => Promise<void>;
}

const defaultColors: ThemeColors = {
  primary: '#7c3aed',
  secondary: '#ec4899',
  accent: '#a855f7',
  background: '#111827',
  text: '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('devsync-color-mode');
  if (stored === 'light' || stored === 'dark') return stored;
  // Respect system preference
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [colorMode, setColorModeState] = useState<ColorMode>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Initialize color mode on mount
  useEffect(() => {
    setMounted(true);
    const mode = getInitialColorMode();
    setColorModeState(mode);
    applyColorMode(mode);
  }, []);

  const applyColorMode = useCallback((mode: ColorMode) => {
    document.documentElement.setAttribute('data-theme', mode);
    localStorage.setItem('devsync-color-mode', mode);
    // Enable transitions after a tiny delay so initial paint doesn't flash
    requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-transition');
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
    });
  }, []);

  const setColorMode = useCallback((mode: ColorMode) => {
    setColorModeState(mode);
    applyColorMode(mode);
  }, [applyColorMode]);

  const toggleColorMode = useCallback(() => {
    const newMode = colorMode === 'dark' ? 'light' : 'dark';
    setColorMode(newMode);
  }, [colorMode, setColorMode]);

  const loadTheme = async () => {
    if (!isAuthenticated) {
      setColors(defaultColors);
      setIsLoading(false);
      return;
    }

    try {
      const theme = await portfolioApi.getTheme();
      setColors({
        primary: theme.primary_color || defaultColors.primary,
        secondary: theme.secondary_color || defaultColors.secondary,
        accent: theme.accent_color || defaultColors.accent,
        background: theme.background_color || defaultColors.background,
        text: theme.text_color || defaultColors.text,
      });
    } catch (err) {
      console.error('Failed to load theme:', err);
      setColors(defaultColors);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTheme();
  }, [isAuthenticated]);

  const refreshTheme = async () => {
    await loadTheme();
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ colors, colorMode: 'dark', toggleColorMode: () => {}, setColorMode: () => {}, isLoading: true, refreshTheme: async () => {} }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ colors, colorMode, toggleColorMode, setColorMode, isLoading, refreshTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// CSS variable injector component
export function ThemeStyles() {
  const { colors } = useTheme();

  return (
    <style jsx global>{`
      :root {
        --color-primary: ${colors.primary};
        --color-secondary: ${colors.secondary};
        --color-accent: ${colors.accent};
      }
    `}</style>
  );
}
