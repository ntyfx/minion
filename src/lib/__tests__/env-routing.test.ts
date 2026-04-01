import { describe, expect, it } from "vitest";
import { getCurrentEnv, isSessionEnvMismatch } from "@/lib/env-routing";
import type { AppSettings } from "@/types/chat";

function createSettings(activeEnv: AppSettings["activeEnv"], baseUrl: string): AppSettings {
  return {
    activeEnv,
    envs: {
      local: { baseUrl: "http://localhost:8080", accessToken: "" },
      staging: { baseUrl, accessToken: "staging-token" },
      prod: { baseUrl: "https://minion.example.com", accessToken: "prod-token" },
    },
  };
}

describe("env routing helpers", () => {
  it("uses selected env as current env even when URL looks staging", () => {
    const settings = createSettings("local", "https://minion.stg.example.com");
    expect(getCurrentEnv(settings)).toBe("local");
  });

  it("returns mismatch when session env differs from current env", () => {
    expect(
      isSessionEnvMismatch({ env: "local" }, "staging"),
    ).toBe(true);
  });

  it("returns false when session env matches current env", () => {
    expect(
      isSessionEnvMismatch({ env: "staging" }, "staging"),
    ).toBe(false);
  });

  it("returns false when session env is not set", () => {
    expect(
      isSessionEnvMismatch({ env: undefined }, "prod"),
    ).toBe(false);
    expect(isSessionEnvMismatch(null, "prod")).toBe(false);
  });
});
