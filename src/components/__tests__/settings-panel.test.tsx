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

  it("renders modal with title, fields and version", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("settings.title");
    expect(baseElement.textContent).toContain("settings.apiBaseUrl");
    expect(baseElement.textContent).toContain("settings.accessToken");
    expect(baseElement.textContent).toContain("settings.version");
  });

  it("renders API endpoint hints", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("settings.apiUsedFor");
    expect(baseElement.textContent).toContain("settings.sentAs");
  });

  it("calls onSave with current values when Save clicked", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const saveBtn = findButtonByText(baseElement, "settings.save");
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

    const saveBtn = findButtonByText(baseElement, "settings.save");
    act(() => {
      saveBtn!.click();
    });

    expect(baseElement.textContent).toContain("settings.saved");
  });

  it("updates base URL input value", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const input = baseElement.querySelector(
      'input[aria-label="settings.apiBaseUrl"]',
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
      'input[aria-label="settings.apiBaseUrl"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe("http://changed:1234");
  });

  it("renders language selector", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("settings.language");
    expect(baseElement.textContent).toContain("简体中文");
  });

  it("renders theme swatches", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("theme.chooseTheme");
    const swatches = baseElement.querySelectorAll(
      'button[aria-pressed]',
    );
    expect(swatches.length).toBe(6);
  });

  it("marks active theme swatch", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    const activeSwatches = baseElement.querySelectorAll(
      'button[aria-pressed="true"]',
    );
    expect(activeSwatches.length).toBe(1);
  });

  it("renders alert inside API Base URL fieldset", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    const fieldsets = baseElement.querySelectorAll("fieldset");
    const apiFieldset = fieldsets[0];
    expect(apiFieldset).toBeTruthy();
    const alert = apiFieldset?.querySelector(".ant-alert");
    expect(alert).toBeTruthy();
    expect(apiFieldset?.textContent).toContain("settings.alertInfo");
  });
});
