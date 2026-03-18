import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const infoSpy = vi.fn();

vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  return {
    ...actual,
    notification: {
      ...actual.notification,
      useNotification: () => [{ info: infoSpy }, null],
    },
  };
});

describe("useUpdateNotification", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    infoSpy.mockClear();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  async function loadAndRender() {
    const mod = await import("../use-update-notification");
    return renderHook(() => mod.useUpdateNotification());
  }

  it("does not notify when version matches", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.0.0");
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ version: "1.0.0" }), { status: 200 }),
      ),
    );

    await loadAndRender();
    await act(async () => {
      vi.advanceTimersByTime(11_000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(infoSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("notifies when a new version is available", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.0.0");
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ version: "2.0.0" }), { status: 200 }),
      ),
    );

    await loadAndRender();
    await act(async () => {
      vi.advanceTimersByTime(11_000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "update.title",
        description: "update.description",
      }),
    );
    vi.unstubAllEnvs();
  });

  it("does not notify twice for the same new version", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.0.0");
    fetchSpy.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ version: "2.0.0" }), { status: 200 }),
      ),
    );

    await loadAndRender();

    await act(async () => {
      vi.advanceTimersByTime(11_000);
      await vi.runOnlyPendingTimersAsync();
    });

    await act(async () => {
      vi.advanceTimersByTime(5 * 60 * 1000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("handles fetch failure gracefully", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.0.0");
    fetchSpy.mockImplementation(() => Promise.reject(new Error("offline")));

    await loadAndRender();
    await act(async () => {
      vi.advanceTimersByTime(11_000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(infoSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("handles non-ok response gracefully", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VERSION", "1.0.0");
    fetchSpy.mockImplementation(() =>
      Promise.resolve(new Response("", { status: 404 })),
    );

    await loadAndRender();
    await act(async () => {
      vi.advanceTimersByTime(11_000);
      await vi.runOnlyPendingTimersAsync();
    });

    expect(infoSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
