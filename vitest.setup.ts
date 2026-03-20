import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

vi.mock("next-intl", () => {
  function useTranslations(ns: string) {
    const t = (key: string, values?: Record<string, unknown>) => {
      let result = `${ns}.${key}`;
      if (values) {
        for (const [k, v] of Object.entries(values)) {
          result = result.replace(`{${k}}`, String(v));
        }
      }
      return result;
    };
    t.rich = (key: string, values?: Record<string, unknown>) => {
      const parts: unknown[] = [`${ns}.${key}`];
      if (values) {
        for (const [, v] of Object.entries(values)) {
          if (typeof v === "function") parts.push(v());
        }
      }
      return parts;
    };
    return t;
  }
  return { useTranslations };
});

vi.mock("@/lib/theme", () => ({
  useTheme: () => ({ themeId: "dark", colorScheme: "dark", setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/lib/locale", () => ({
  useAppLocale: () => ({ locale: "zh-CN", setLocale: () => {} }),
  getAntdLocale: () => ({}),
  LOCALE_LIST: [
    { id: "zh-CN", label: "简体中文" },
    { id: "en-US", label: "English" },
  ],
}));

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

class IntersectionObserverStub {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  get root() { return null; }
  get rootMargin() { return "0px"; }
  get thresholds() { return [0]; }
  takeRecords(): IntersectionObserverEntry[] { return []; }
}
globalThis.IntersectionObserver ??= IntersectionObserverStub as unknown as typeof IntersectionObserver;

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = function scrollIntoView() {};
}
