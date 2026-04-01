import { describe, it, expect, beforeEach } from "vitest";
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
    expect(settings.activeEnv).toBe("local");
    expect(settings.envs.local.baseUrl).toBe("http://localhost:8080");
    expect(settings.envs.local.accessToken).toBe("");
    expect(settings.envs.staging.baseUrl).toBe("");
    expect(settings.envs.prod.baseUrl).toBe("");
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
    saveSettings({
      activeEnv: "staging",
      envs: {
        local: { baseUrl: "http://localhost:8080", accessToken: "local_tok" },
        staging: { baseUrl: "https://api.test.com", accessToken: "tok_123" },
        prod: { baseUrl: "https://prod.example.com", accessToken: "prod_tok" },
      },
    });
    const loaded = loadSettings();
    expect(loaded.activeEnv).toBe("staging");
    expect(loaded.envs.staging.baseUrl).toBe("https://api.test.com");
    expect(loaded.envs.staging.accessToken).toBe("tok_123");
    expect(localStorage.getItem("minion-demo-base-url")).toBe("https://api.test.com");
    expect(localStorage.getItem("minion-demo-access-token")).toBe("tok_123");
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
    saveSettings({
      activeEnv: "local",
      envs: {
        local: { baseUrl: "example.com///", accessToken: "" },
        staging: { baseUrl: "", accessToken: "" },
        prod: { baseUrl: "", accessToken: "" },
      },
    });
    const loaded = loadSettings();
    expect(loaded.envs.local.baseUrl).toBe("http://example.com");
  });

  it("merges legacy keys into local config for local URLs", () => {
    localStorage.setItem("minion-demo-base-url", "http://localhost:8080");
    localStorage.setItem("minion-demo-access-token", "legacy-token");

    const loaded = loadSettings();
    expect(loaded.activeEnv).toBe("local");
    expect(loaded.envs.local.baseUrl).toBe("http://localhost:8080");
    expect(loaded.envs.local.accessToken).toBe("legacy-token");
    expect(loaded.envs.staging.baseUrl).toBe("");
    expect(loaded.envs.prod.baseUrl).toBe("");
  });

  it("maps legacy staging URL into staging env", () => {
    localStorage.setItem("minion-demo-base-url", "https://minion.stg.example.com");
    localStorage.setItem("minion-demo-access-token", "staging-token");

    const loaded = loadSettings();
    expect(loaded.activeEnv).toBe("staging");
    expect(loaded.envs.staging.baseUrl).toBe("https://minion.stg.example.com");
    expect(loaded.envs.staging.accessToken).toBe("staging-token");
    expect(loaded.envs.local.accessToken).toBe("");
  });

  it("merges partial v2 payload with defaults", () => {
    localStorage.setItem(
      "minion-demo-settings-v2",
      JSON.stringify({
        activeEnv: "prod",
        envs: {
          prod: { baseUrl: "prod.example.com///", accessToken: "prod-secret" },
        },
      }),
    );
    const loaded = loadSettings();
    expect(loaded.activeEnv).toBe("prod");
    expect(loaded.envs.prod.baseUrl).toBe("http://prod.example.com");
    expect(loaded.envs.prod.accessToken).toBe("prod-secret");
    expect(loaded.envs.local.baseUrl).toBe("http://localhost:8080");
  });
});

describe("clearToken", () => {
  it("clears active env token in localStorage", () => {
    saveSettings({
      activeEnv: "staging",
      envs: {
        local: { baseUrl: "http://localhost:8080", accessToken: "local-token" },
        staging: { baseUrl: "http://staging.local", accessToken: "secret" },
        prod: { baseUrl: "http://prod.local", accessToken: "prod-token" },
      },
    });
    clearToken();
    const loaded = loadSettings();
    expect(loaded.envs.staging.accessToken).toBe("");
    expect(loaded.envs.local.accessToken).toBe("local-token");
    expect(localStorage.getItem("minion-demo-access-token")).toBe("");
  });
});
