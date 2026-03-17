import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, waitFor, cleanup } from "@testing-library/react";
import { ToolsToggle } from "@/components/tools-status";

function findRefreshBtn(root: HTMLElement) {
  return root.querySelector(
    'button[aria-label="Refresh tools status"]',
  ) as HTMLButtonElement | null;
}

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
      'button[aria-label="Open tools status"]',
    );
    expect(btn).toBeTruthy();
  });

  it("opens popover on click and shows initial state", async () => {
    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open tools status"]',
    )!;
    act(() => {
      btn.click();
    });
    await waitFor(() => {
      expect(baseElement.textContent).toContain("Tools Status");
      expect(baseElement.textContent).toContain("Click Refresh to load tools status.");
    });
  });

  it("shows error when no access token and refresh clicked", async () => {
    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="" />,
    );
    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open tools status"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(findRefreshBtn(baseElement)).toBeTruthy();
    });

    await act(async () => {
      findRefreshBtn(baseElement)!.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain(
        "Set an access token in Settings first.",
      );
    });
  });

  it("loads and displays skills on refresh", async () => {
    const mockPayload = {
      skills: [
        { name: "code_review", status: "eligible" },
        { name: "debug", status: "ineligible" },
      ],
      active_version: "v1.2.3",
      loaded_at: "2024-01-01",
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
    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open tools status"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(findRefreshBtn(baseElement)).toBeTruthy();
    });

    await act(async () => {
      findRefreshBtn(baseElement)!.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("v1.2.3");
      expect(baseElement.textContent).toContain("2024-01-01");
      expect(baseElement.textContent).toContain("code_review");
    });
  });

  it("shows error when fetch fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error"),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );
    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open tools status"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(findRefreshBtn(baseElement)).toBeTruthy();
    });

    await act(async () => {
      findRefreshBtn(baseElement)!.click();
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
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockPayload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );
    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open tools status"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(findRefreshBtn(baseElement)).toBeTruthy();
    });

    await act(async () => {
      findRefreshBtn(baseElement)!.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain(
        "No skills returned by the server.",
      );
    });
  });

  it("handles non-Error thrown from fetch", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce("string error");

    const { container, baseElement } = render(
      <ToolsToggle baseUrl="http://test" accessToken="tok" />,
    );
    const triggerBtn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open tools status"]',
    )!;
    act(() => {
      triggerBtn.click();
    });

    await waitFor(() => {
      expect(findRefreshBtn(baseElement)).toBeTruthy();
    });

    await act(async () => {
      findRefreshBtn(baseElement)!.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("string error");
    });
  });
});
