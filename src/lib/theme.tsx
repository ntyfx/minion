"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  type ThemeId,
  type ColorScheme,
  isValidThemeId,
  getThemeDefinition,
} from "./themes";

export type { ThemeId };

interface ThemeContextValue {
  themeId: ThemeId;
  colorScheme: ColorScheme;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: "dark",
  colorScheme: "dark",
  setTheme: () => {},
});

const STORAGE_KEY = "minion-chat-theme";

function getClientThemeId(): ThemeId {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr && isValidThemeId(attr)) return attr;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isValidThemeId(stored)) return stored;

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>("dark");
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- hydration: read client theme once after mount to avoid SSR mismatch */
  useEffect(() => {
    setThemeId(getClientThemeId());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const applyTheme = useCallback((id: ThemeId) => {
    const { meta } = getThemeDefinition(id);
    document.documentElement.setAttribute("data-theme", id);
    document.documentElement.style.colorScheme = meta.colorScheme;
  }, []);

  useEffect(() => {
    if (mounted) applyTheme(themeId);
  }, [themeId, mounted, applyTheme]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setThemeId(id);
      localStorage.setItem(STORAGE_KEY, id);
    },
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setThemeId(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!mounted) return null;

  const colorScheme = getThemeDefinition(themeId).meta.colorScheme;

  return (
    <ThemeContext.Provider value={{ themeId, colorScheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
