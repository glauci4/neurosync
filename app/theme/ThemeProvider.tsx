"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ThemePreference } from "./theme.types";
import {
  applyThemePreference,
  getStoredThemePreference,
  setStoredThemePreference,
} from "./themeStorage";

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("claro");

  useEffect(() => {
    const storedPreference = getStoredThemePreference();
    setPreferenceState(storedPreference);
    applyThemePreference(storedPreference);
  }, []);

  useEffect(() => {
    if (preference !== "automatico") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyThemePreference("automatico");

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference: (nextPreference) => {
        setStoredThemePreference(nextPreference);
        setPreferenceState(nextPreference);
        applyThemePreference(nextPreference);
      },
    }),
    [preference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error(
      "useThemePreference deve ser usado dentro de ThemeProvider",
    );
  }

  return context;
}
