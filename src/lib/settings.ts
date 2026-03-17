import type { AppSettings } from "@/types/chat";

const STORAGE_KEYS = {
  baseUrl: "minion-demo-base-url",
  accessToken: "minion-demo-access-token",
} as const;

function preferredDefaultBaseUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8080";
  const { protocol, port, origin } = window.location;
  if (
    (protocol === "http:" || protocol === "https:") &&
    (port === "" || port === "8080")
  ) {
    return origin;
  }
  return "http://localhost:8080";
}

function normalizeBaseUrl(value: string): string {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return { baseUrl: "http://localhost:8080", accessToken: "" };
  }
  const storedBaseUrl = localStorage.getItem(STORAGE_KEYS.baseUrl) || "";
  return {
    baseUrl: normalizeBaseUrl(storedBaseUrl) || preferredDefaultBaseUrl(),
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken) || "",
  };
}

export function saveSettings(settings: AppSettings): void {
  const baseUrl =
    normalizeBaseUrl(settings.baseUrl) || preferredDefaultBaseUrl();
  localStorage.setItem(STORAGE_KEYS.baseUrl, baseUrl);
  localStorage.setItem(STORAGE_KEYS.accessToken, settings.accessToken);
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
}

export { preferredDefaultBaseUrl, normalizeBaseUrl };
