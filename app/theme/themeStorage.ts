import {
  DEFAULT_THEME_PREFERENCE,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "./theme.types";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "claro" || value === "escuro" || value === "automatico";
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME_PREFERENCE;

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference)
    ? storedPreference
    : DEFAULT_THEME_PREFERENCE;
}

export function setStoredThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}

export function resolveThemePreference(preference: ThemePreference) {
  if (preference === "escuro") return "escuro";
  if (preference === "claro") return "claro";

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "escuro";
  }

  return "claro";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") return;

  const resolvedTheme = resolveThemePreference(preference);
  document.documentElement.classList.toggle("dark", resolvedTheme === "escuro");
  document.documentElement.dataset.themePreference = preference;
  document.documentElement.dataset.theme = resolvedTheme;
}

