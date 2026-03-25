import { describe, it, expect } from "vitest";
import { detectEnvFromUrl, ENV_COLORS, type EnvType } from "@/lib/environment";

describe("detectEnvFromUrl", () => {
  it("returns 'local' for empty string", () => {
    expect(detectEnvFromUrl("")).toBe("local");
  });

  it("returns 'local' for localhost URLs", () => {
    expect(detectEnvFromUrl("http://localhost:8080")).toBe("local");
    expect(detectEnvFromUrl("https://localhost")).toBe("local");
    expect(detectEnvFromUrl("http://localhost:3000/api")).toBe("local");
  });

  it("returns 'local' for 127.0.0.1", () => {
    expect(detectEnvFromUrl("http://127.0.0.1:8080")).toBe("local");
    expect(detectEnvFromUrl("https://127.0.0.1")).toBe("local");
  });

  it("returns 'local' for IPv6 loopback", () => {
    expect(detectEnvFromUrl("http://[::1]:8080")).toBe("local");
  });

  it("returns 'staging' for URLs containing 'stg'", () => {
    expect(detectEnvFromUrl("https://api-stg.example.com")).toBe("staging");
    expect(detectEnvFromUrl("https://stg.example.com/api")).toBe("staging");
  });

  it("returns 'staging' for URLs containing 'stging'", () => {
    expect(detectEnvFromUrl("https://api-stging.example.com")).toBe("staging");
  });

  it("returns 'staging' for URLs containing 'staging'", () => {
    expect(detectEnvFromUrl("https://staging.example.com")).toBe("staging");
    expect(detectEnvFromUrl("https://api.staging.example.com")).toBe("staging");
  });

  it("is case-insensitive for staging patterns", () => {
    expect(detectEnvFromUrl("https://API-STG.example.com")).toBe("staging");
    expect(detectEnvFromUrl("https://Staging.example.com")).toBe("staging");
  });

  it("returns 'prod' for URLs with 'pro' or 'prod'", () => {
    expect(detectEnvFromUrl("https://api-prod.example.com")).toBe("prod");
    expect(detectEnvFromUrl("https://pro.example.com")).toBe("prod");
  });

  it("returns 'prod' for any non-local, non-staging URL", () => {
    expect(detectEnvFromUrl("https://api.example.com")).toBe("prod");
    expect(detectEnvFromUrl("https://minion.company.io")).toBe("prod");
    expect(detectEnvFromUrl("https://10.0.0.1:8080")).toBe("prod");
  });

  it("does not false-positive 'stg' inside unrelated words", () => {
    // "stg" must be a word boundary match
    expect(detectEnvFromUrl("https://poststg.example.com")).toBe("prod");
  });
});

describe("ENV_COLORS", () => {
  it("defines colors for all env types", () => {
    const envTypes: EnvType[] = ["local", "staging", "prod"];
    for (const env of envTypes) {
      expect(ENV_COLORS[env]).toBeDefined();
      expect(ENV_COLORS[env]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

