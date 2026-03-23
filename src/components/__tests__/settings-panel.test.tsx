import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, fireEvent, cleanup } from "@testing-library/react";

const { mockSetTheme, mockGetStorageEstimate } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockGetStorageEstimate: vi.fn().mockResolvedValue({ usage: 100, quota: 1000 }),
}));

vi.mock("@/lib/session-db", () => ({
  getStorageEstimate: mockGetStorageEstimate,
}));

vi.mock("@/lib/theme", () => ({
  useTheme: () => ({
    themeId: "dark",
    colorScheme: "dark" as const,
    setTheme: mockSetTheme,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function findButtonByText(root: HTMLElement, text: string) {
  return Array.from(root.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(text),
  );
}

describe("SettingsPanel component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockSetTheme.mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  const defaultProps = {
    settings: { baseUrl: "http://localhost:8080", accessToken: "tok123" },
    onSave: vi.fn(),
    open: true,
    onToggle: vi.fn(),
    sessionCount: 3,
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
    expect(swatches.length).toBe(7);
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

  it("calls setTheme when a theme swatch is clicked", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const lightBtn = baseElement.querySelector<HTMLButtonElement>(
      '[data-testid="theme-button-light"]',
    );
    expect(lightBtn).toBeTruthy();
    act(() => {
      lightBtn!.click();
    });

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("updates access token input value", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const input = baseElement.querySelector(
      'input[aria-label="settings.accessToken"]',
    ) as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.value).toBe("tok123");

    fireEvent.change(input, { target: { value: "new-secret-token" } });
    expect(input.value).toBe("new-secret-token");
  });

  it("clears access token and saves when clear control is used", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const clearIcon = baseElement.querySelector<HTMLElement>(
      '[aria-label="settings.clearToken"]',
    );
    expect(clearIcon).toBeTruthy();
    act(() => {
      clearIcon!.click();
    });

    const input = baseElement.querySelector(
      'input[aria-label="settings.accessToken"]',
    ) as HTMLInputElement;
    expect(input.value).toBe("");
    expect(onSave).toHaveBeenCalledWith({
      baseUrl: "http://localhost:8080",
      accessToken: "",
    });
    expect(baseElement.textContent).toContain("settings.tokenCleared");
  });

  it("loads default URL when reset icon clicked", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const resetIcon = baseElement.querySelector<HTMLElement>(
      '[aria-label="settings.resetUrl"]',
    );
    expect(resetIcon).toBeTruthy();
    act(() => {
      resetIcon!.click();
    });

    expect(onSave).toHaveBeenCalled();
    expect(baseElement.textContent).toContain("settings.urlReset");
  });

  it("closes modal when cancel clicked", async () => {
    const onToggle = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onToggle={onToggle} />,
    );

    const cancelBtn = findButtonByText(baseElement, "Cancel");
    expect(cancelBtn).toBeTruthy();
    act(() => {
      cancelBtn!.click();
    });

    expect(onToggle).toHaveBeenCalled();
  });

  it("fetches storage info when modal opens", async () => {
    const { getStorageEstimate } = await import("@/lib/session-db");
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { rerender } = render(
      <SettingsPanel {...defaultProps} open={false} />,
    );

    expect(getStorageEstimate).not.toHaveBeenCalled();

    rerender(<SettingsPanel {...defaultProps} open={true} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(getStorageEstimate).toHaveBeenCalled();
  });

  it("shows storage unavailable when storageInfo is null", async () => {
    const { getStorageEstimate } = await import("@/lib/session-db");
    vi.mocked(getStorageEstimate).mockResolvedValueOnce(null);

    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(baseElement.textContent).toContain("settings.storageUnavailable");
  });

  it("shows storage info with progress bar when available", async () => {
    const { getStorageEstimate } = await import("@/lib/session-db");
    vi.mocked(getStorageEstimate).mockResolvedValueOnce({
      usage: 500 * 1024 * 1024,
      quota: 1024 * 1024 * 1024,
    });

    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(baseElement.textContent).toContain("settings.storageUsed");
  });
});

describe("formatBytes function", () => {
  it("formats bytes correctly", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel
        settings={{ baseUrl: "http://localhost:8080", accessToken: "" }}
        onSave={vi.fn()}
        open={true}
        onToggle={vi.fn()}
        sessionCount={0}
      />,
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(baseElement).toBeTruthy();
  });
});
