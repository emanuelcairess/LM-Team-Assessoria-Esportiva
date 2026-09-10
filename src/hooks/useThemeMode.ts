import { useState, useEffect, useCallback } from 'react';
import { soundFx } from '../utils/audio';

export function useThemeMode() {
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('lm_team_theme');
      if (saved) return saved === 'dark';
      return !window.matchMedia('(prefers-color-scheme: light)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      if (isDarkTheme) {
        document.body.classList.remove('light-theme', 'light');
        document.body.classList.add('dark');
        document.documentElement.classList.remove('light-theme', 'light');
        document.documentElement.classList.add('dark');
        localStorage.setItem('lm_team_theme', 'dark');
      } else {
        document.body.classList.remove('dark');
        document.body.classList.add('light-theme', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light-theme', 'light');
        localStorage.setItem('lm_team_theme', 'light');
      }
    } catch {}
  }, [isDarkTheme]);

  const toggleTheme = useCallback(() => {
    soundFx.playClick();
    setIsDarkTheme((prev) => !prev);
  }, []);

  return {
    isDarkTheme,
    theme: (isDarkTheme ? 'dark' : 'light') as 'dark' | 'light',
    toggleTheme
  };
}
