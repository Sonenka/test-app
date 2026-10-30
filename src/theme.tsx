import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const palettes = {
  dark: {
    background: '#0B1118', surface: '#131D28', raised: '#1B2836', border: '#293746',
    text: '#F2F6FA', muted: '#99ABBD', accent: '#B9F568', accentText: '#17240C',
    live: '#FF8D80', liveBackground: '#382721', favorite: '#F4CC71',
    favoriteBackground: '#332F25', overlay: 'rgba(0,0,0,0.72)',
  },
  light: {
    background: '#F1F4F0', surface: '#FFFFFF', raised: '#E9EFE7', border: '#D8E1D5',
    text: '#18271E', muted: '#5B6E61', accent: '#345E25', accentText: '#FFFFFF',
    live: '#B33429', liveBackground: '#FFF0EB', favorite: '#986B09',
    favoriteBackground: '#FFF5D9', overlay: 'rgba(17,30,22,0.45)',
  },
};
export type ThemeColors = typeof palettes.dark;
type Mode = keyof typeof palettes;
const ThemeContext = createContext<{ colors: ThemeColors; dark: boolean; toggleTheme: () => void } | null>(null);
const KEY = 'matches:theme:v1';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(stored => {
      if (active && (stored === 'dark' || stored === 'light')) setMode(current => current ?? stored);
    }).catch(error => console.warn('Не удалось прочитать тему.', error));
    return () => { active = false; };
  }, []);
  const resolved = mode ?? 'dark';
  function toggleTheme() {
    const next = resolved === 'dark' ? 'light' : 'dark';
    setMode(next);
    writes.current = writes.current.then(() => AsyncStorage.setItem(KEY, next))
      .catch(error => { console.warn('Не удалось сохранить тему.', error); });
  }
  return <ThemeContext.Provider value={{ colors: palettes[resolved], dark: resolved === 'dark', toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('ThemeProvider is required');
  return theme;
}
