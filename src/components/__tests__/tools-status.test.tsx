import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, waitFor, cleanup } from "@testing-library/react";
import { ToolsToggle } from "@/components/tools-status";

describe("ToolsToggle component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the tools status button", () => {
    const { container } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    );
    expect(btn).toBeTruthy();
  });

  it("auto-refreshes on mount when token is set", async () => {
    const mockPayload = {
      skills: [{ name: "code_review", status: "eligible" }],
      active_version: "v2.0",
      loaded_at: "2024-06-01",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );

    await act(async () => {});

    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("v2.0");
      expect(baseElement.textContent).toContain("code_review");
    });
  });

  it("shows error when no access token", async () => {
    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="" />,
    );
    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("tools.noToken");
    });
  });

  it("refreshes when popover opens and displays skills", async () => {
    const mockPayload = {
      skills: [
        { name: "code_review", status: "eligible" },
        { name: "debug", status: "ineligible" },
      ],
      active_version: "v1.2.3",
      loaded_at: "2024-01-01",
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );

    await act(async () => {});

    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("v1.2.3");
      expect(baseElement.textContent).toContain("2024-01-01");
      expect(baseElement.textContent).toContain("code_review");
    });
  });

  it("shows error when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.reject(new Error("Network error")),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );

    await act(async () => {});

    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("Network error");
    });
  });

  it("shows warning when no skills returned", async () => {
    const mockPayload = {
      skills: [],
      active_version: "v1.0",
      loaded_at: "now",
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify(mockPayload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );

    await act(async () => {});

    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("tools.noSkills");
    });
  });

  it("handles non-Error thrown from fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.reject("string error"),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );

    await act(async () => {});

    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tools.openStatus"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("string error");
    });
  });
});
