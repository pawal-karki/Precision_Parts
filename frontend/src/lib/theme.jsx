import { useSyncExternalStore } from "react";

export const THEME_STORAGE_KEY = "precision-parts-theme";

/** @returns {"light" | "dark" | "system"} */
export function getThemePreference() {
  if (typeof localStorage === "undefined") return "system";
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

/** @param {"light" | "dark" | "system"} mode */
export function setThemePreference(mode) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, mode);
  applyTheme(mode);
  window.dispatchEvent(new Event("pp-theme"));
}

/** @param {"light" | "dark" | "system"} mode */
export function applyTheme(mode) {
  const root = document.documentElement;
  root.classList.remove("dark");
  if (mode === "dark") {
    root.classList.add("dark");
    return;
  }
  if (mode === "system" && typeof window !== "undefined") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      root.classList.add("dark");
    }
  }
}

let mediaListenerAttached = false;

export function initTheme() {
  applyTheme(getThemePreference());
  if (typeof window === "undefined" || mediaListenerAttached) return;
  mediaListenerAttached = true;
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (getThemePreference() === "system") {
      applyTheme("system");
      window.dispatchEvent(new Event("pp-theme"));
    }
  });
}

function subscribe(onStoreChange) {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener("pp-theme", handler);
  return () => window.removeEventListener("pp-theme", handler);
}

function getSnapshot() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = () => {
    setThemePreference(dark ? "light" : "dark");
  };
  return {
    dark,
    preference: getThemePreference(),
    setThemePreference,
    toggle,
  };
}
