import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent, cleanup } from "@testing-library/react";

function findButtonByText(root: HTMLElement, text: string) {
  return Array.from(root.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
}

describe("SettingsPanel component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    settings: { baseUrl: "http://localhost:8080", accessToken: "tok123" },
    onSave: vi.fn(),
    open: true,
    onToggle: vi.fn(),
  };

  it("renders drawer with title and fields", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("Settings");
    expect(baseElement.textContent).toContain("API Base URL");
    expect(baseElement.textContent).toContain("Access Token");
  });

  it("renders API endpoint hints", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("/api/v1/chat");
    expect(baseElement.textContent).toContain("/api/v1/skills");
  });

  it("calls onSave with current values when Save clicked", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const saveBtn = findButtonByText(baseElement, "Save");
    expect(saveBtn).toBeTruthy();
    act(() => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8080",
      accessToken: "tok123",
    });
  });

  it("shows success notice after save", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const saveBtn = findButtonByText(baseElement, "Save");
    act(() => {
      saveBtn!.click();
    });

    expect(baseElement.textContent).toContain("Settings saved.");
  });

  it("resets URL when Reset URL clicked", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const resetBtn = findButtonByText(baseElement, "Reset URL");
    expect(resetBtn).toBeTruthy();
    act(() => {
      resetBtn!.click();
    });

    expect(onSave).toHaveBeenCalled();
    expect(baseElement.textContent).toContain("Base URL reset to default.");
  });

  it("clears token when Clear Token clicked", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const clearBtn = findButtonByText(baseElement, "Clear Token");
    expect(clearBtn).toBeTruthy();
    act(() => {
      clearBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8080",
      accessToken: "",
    });
    expect(baseElement.textContent).toContain("Access token cleared.");
  });

  it("updates base URL input value", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const input = baseElement.querySelector(
      'input[aria-label="API Base URL"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe("http://localhost:8080");

    fireEvent.change(input, { target: { value: "http://new-url:9090" } });
    expect(input.value).toBe("http://new-url:9090");
  });

  it("syncs with new settings prop", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement, rerender } = render(
      <SettingsPanel {...defaultProps} />,
    );

    rerender(
      <SettingsPanel
        {...defaultProps}
        settings={{ baseUrl: "http://changed:1234", accessToken: "new-tok" }}
      />,
    );

    const input = baseElement.querySelector(
      'input[aria-label="API Base URL"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe("http://changed:1234");
  });
});
