import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  normalizeBaseUrl,
  preferredDefaultBaseUrl,
  loadSettings,
  saveSettings,
  clearToken,
} from "@/lib/settings";

beforeEach(() => {
  localStorage.clear();
});

describe("normalizeBaseUrl", () => {
  it("returns empty string for empty input", () => {
    expect(normalizeBaseUrl("")).toBe("");
    expect(normalizeBaseUrl("   ")).toBe("");
  });

  it("strips trailing slashes", () => {
    expect(normalizeBaseUrl("http://example.com///")).toBe(
      "http://example.com",
    );
  });

  it("preserves existing http:// protocol", () => {
    expect(normalizeBaseUrl("http://localhost:8080")).toBe(
      "http://localhost:8080",
    );
  });

  it("preserves existing https:// protocol", () => {
    expect(normalizeBaseUrl("https://api.example.com")).toBe(
      "https://api.example.com",
    );
  });

  it("prepends http:// when no protocol", () => {
    expect(normalizeBaseUrl("localhost:8080")).toBe("http://localhost:8080");
    expect(normalizeBaseUrl("example.com")).toBe("http://example.com");
  });

  it("handles null-ish input gracefully", () => {
    expect(normalizeBaseUrl(null as unknown as string)).toBe("");
    expect(normalizeBaseUrl(undefined as unknown as string)).toBe("");
  });
});

describe("preferredDefaultBaseUrl", () => {
  it("returns origin when on port 8080", () => {
    Object.defineProperty(window, "location", {
      value: { protocol: "http:", port: "8080", origin: "http://myhost:8080" },
      writable: true,
    });
    expect(preferredDefaultBaseUrl()).toBe("http://myhost:8080");
  });

  it("returns origin when port is empty (default 80/443)", () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "https:",
        port: "",
        origin: "https://prod.example.com",
      },
      writable: true,
    });
    expect(preferredDefaultBaseUrl()).toBe("https://prod.example.com");
  });

  it("falls back to localhost:8080 for non-standard ports", () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        port: "3000",
        origin: "http://localhost:3000",
      },
      writable: true,
    });
    expect(preferredDefaultBaseUrl()).toBe("http://localhost:8080");
  });
});

describe("loadSettings / saveSettings", () => {
  it("returns defaults when nothing stored", () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        port: "3000",
        origin: "http://localhost:3000",
      },
      writable: true,
    });
    const settings = loadSettings();
    expect(settings.baseUrl).toBe("http://localhost:8080");
    expect(settings.accessToken).toBe("");
  });

  it("round-trips through save and load", () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        port: "3000",
        origin: "http://localhost:3000",
      },
      writable: true,
    });
    saveSettings({ baseUrl: "https://api.test.com", accessToken: "tok_123" });
    const loaded = loadSettings();
    expect(loaded.baseUrl).toBe("https://api.test.com");
    expect(loaded.accessToken).toBe("tok_123");
  });

  it("normalizes base URL on save", () => {
    Object.defineProperty(window, "location", {
      value: {
        protocol: "http:",
        port: "3000",
        origin: "http://localhost:3000",
      },
      writable: true,
    });
    saveSettings({ baseUrl: "example.com///", accessToken: "" });
    const loaded = loadSettings();
    expect(loaded.baseUrl).toBe("http://example.com");
  });
});

describe("clearToken", () => {
  it("removes access token from localStorage", () => {
    saveSettings({
      baseUrl: "http://localhost:8080",
      accessToken: "secret",
    });
    clearToken();
    expect(localStorage.getItem("minion-demo-access-token")).toBeNull();
  });
});
