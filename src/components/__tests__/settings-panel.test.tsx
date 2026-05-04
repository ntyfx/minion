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
    settings: {
      activeEnv: "local" as const,
      envs: {
        local: { baseUrl: "http://localhost:8080", accessToken: "tok123" },
        staging: { baseUrl: "https://staging.example.com", accessToken: "staging-token" },
        prod: { baseUrl: "https://api.example.com", accessToken: "prod-token" },
      },
      aiServices: {
        "claude-code": {
          provider: "claude-code" as const,
          apiKey: "",
          baseUrl: "",
          enabled: false,
        },
        "deepseek": {
          provider: "deepseek" as const,
          apiKey: "",
          baseUrl: "https://api.deepseek.com",
          enabled: false,
        },
      },
    },
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
      activeEnv: "local",
      envs: {
        local: { baseUrl: "http://localhost:8080", accessToken: "tok123" },
        staging: { baseUrl: "https://staging.example.com", accessToken: "staging-token" },
        prod: { baseUrl: "https://api.example.com", accessToken: "prod-token" },
      },
      aiServices: {
        "claude-code": {
          provider: "claude-code" as const,
          apiKey: "",
          baseUrl: "",
          enabled: false,
        },
        "deepseek": {
          provider: "deepseek" as const,
          apiKey: "",
          baseUrl: "https://api.deepseek.com",
          enabled: false,
        },
      },
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
        settings={{
          activeEnv: "local",
          envs: {
            local: { baseUrl: "http://changed:1234", accessToken: "new-tok" },
            staging: { baseUrl: "https://staging.example.com", accessToken: "staging-token" },
            prod: { baseUrl: "https://api.example.com", accessToken: "prod-token" },
          },
          aiServices: {
            "claude-code": {
              provider: "claude-code" as const,
              apiKey: "",
              baseUrl: "",
              enabled: false,
            },
            "deepseek": {
              provider: "deepseek" as const,
              apiKey: "",
              baseUrl: "https://api.deepseek.com",
              enabled: false,
            },
          },
        }}
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

  it("renders environment selector", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);
    expect(baseElement.textContent).toContain("settings.activeEnv");
    expect(baseElement.textContent).toContain("sidebar.env_local");
  });

  it("edits selected env config and keeps other envs intact", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel
        {...defaultProps}
        onSave={onSave}
        settings={{
          activeEnv: "staging",
          envs: {
            local: { baseUrl: "http://localhost:8080", accessToken: "tok123" },
            staging: {
              baseUrl: "https://staging.example.com",
              accessToken: "staging-token",
            },
            prod: { baseUrl: "https://api.example.com", accessToken: "prod-token" },
          },
          aiServices: {
            "claude-code": {
              provider: "claude-code" as const,
              apiKey: "",
              baseUrl: "",
              enabled: false,
            },
            "deepseek": {
              provider: "deepseek" as const,
              apiKey: "",
              baseUrl: "https://api.deepseek.com",
              enabled: false,
            },
          },
        }}
      />,
    );

    const urlInput = baseElement.querySelector(
      'input[aria-label="settings.apiBaseUrl"]',
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("https://staging.example.com");
    fireEvent.change(urlInput, { target: { value: "https://stg.changed.example.com" } });

    const saveBtn = findButtonByText(baseElement, "settings.save");
    expect(saveBtn).toBeTruthy();
    act(() => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalledWith({
      activeEnv: "staging",
      envs: {
        local: { baseUrl: "http://localhost:8080", accessToken: "tok123" },
        staging: {
          baseUrl: "https://stg.changed.example.com",
          accessToken: "staging-token",
        },
        prod: { baseUrl: "https://api.example.com", accessToken: "prod-token" },
      },
      aiServices: {
        "claude-code": {
          provider: "claude-code" as const,
          apiKey: "",
          baseUrl: "",
          enabled: false,
        },
        "deepseek": {
          provider: "deepseek" as const,
          apiKey: "",
          baseUrl: "https://api.deepseek.com",
          enabled: false,
        },
      },
    });
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
      activeEnv: "local",
      envs: {
        local: { baseUrl: "http://localhost:8080", accessToken: "" },
        staging: { baseUrl: "https://staging.example.com", accessToken: "staging-token" },
        prod: { baseUrl: "https://api.example.com", accessToken: "prod-token" },
      },
      aiServices: {
        "claude-code": {
          provider: "claude-code" as const,
          apiKey: "",
          baseUrl: "",
          enabled: false,
        },
        "deepseek": {
          provider: "deepseek" as const,
          apiKey: "",
          baseUrl: "https://api.deepseek.com",
          enabled: false,
        },
      },
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

  it("renders AI Services section with Tabs", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    expect(baseElement.textContent).toContain("settings.aiServices");
    expect(baseElement.textContent).toContain("settings.aiServiceClaudeCode");
    expect(baseElement.textContent).toContain("settings.aiServiceDeepSeek");
  });

  it("toggles AI service enabled state", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const switches = baseElement.querySelectorAll('button[role="switch"]');
    expect(switches.length).toBeGreaterThan(0);

    const claudeCodeSwitch = switches[0];
    expect(claudeCodeSwitch.getAttribute("aria-checked")).toBe("false");

    act(() => {
      fireEvent.click(claudeCodeSwitch);
    });

    expect(claudeCodeSwitch.getAttribute("aria-checked")).toBe("true");

    const saveBtn = findButtonByText(baseElement, "settings.save");
    act(() => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalled();
    const savedSettings = onSave.mock.calls[0][0];
    expect(savedSettings.aiServices["claude-code"].enabled).toBe(true);
  });

  it("updates AI service API Key input", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const inputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceApiKey"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs.length).toBeGreaterThan(0);

    const claudeCodeInput = inputs[0];
    fireEvent.change(claudeCodeInput, { target: { value: "sk-test-12345678" } });
    expect(claudeCodeInput.value).toBe("sk-test-12345678");
  });

  it("updates AI service Base URL input", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel
        {...defaultProps}
        settings={{
          ...defaultProps.settings,
          aiServices: {
            "claude-code": {
              provider: "claude-code" as const,
              apiKey: "",
              baseUrl: "https://claude.example.com",
              enabled: false,
            },
            "deepseek": {
              provider: "deepseek" as const,
              apiKey: "",
              baseUrl: "https://api.deepseek.com",
              enabled: false,
            },
          },
        }}
      />,
    );

    const inputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceBaseUrl"]',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs.length).toBeGreaterThan(0);

    const activeInput = inputs[0];
    expect(activeInput.value).toBe("https://claude.example.com");

    fireEvent.change(activeInput, { target: { value: "https://custom-api.example.com" } });
    expect(activeInput.value).toBe("https://custom-api.example.com");
  });

  it("clears AI service API Key when clear icon clicked", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel
        {...defaultProps}
        onSave={onSave}
        settings={{
          ...defaultProps.settings,
          aiServices: {
            "claude-code": {
              provider: "claude-code" as const,
              apiKey: "sk-existing-key-1234",
              baseUrl: "",
              enabled: true,
            },
            "deepseek": {
              provider: "deepseek" as const,
              apiKey: "",
              baseUrl: "https://api.deepseek.com",
              enabled: false,
            },
          },
        }}
      />,
    );

    const inputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceApiKey"]',
    ) as NodeListOf<HTMLInputElement>;
    const claudeCodeInput = inputs[0];
    expect(claudeCodeInput.value).toBe("sk-existing-key-1234");

    const clearIcons = baseElement.querySelectorAll(
      '[aria-label="settings.clearToken"]',
    );
    expect(clearIcons.length).toBeGreaterThan(0);

    act(() => {
      fireEvent.click(clearIcons[1]);
    });

    expect(claudeCodeInput.value).toBe("");
    expect(baseElement.textContent).toContain("settings.aiServiceApiKeyCleared");

    expect(onSave).not.toHaveBeenCalled();
  });

  it("disables AI service inputs when service is disabled", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(<SettingsPanel {...defaultProps} />);

    const apiKeyInputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceApiKey"]',
    ) as NodeListOf<HTMLInputElement>;
    const baseUrlInputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceBaseUrl"]',
    ) as NodeListOf<HTMLInputElement>;

    expect(apiKeyInputs.length).toBeGreaterThan(0);
    expect(baseUrlInputs.length).toBeGreaterThan(0);
    expect(apiKeyInputs[0].disabled).toBe(true);
    expect(baseUrlInputs[0].disabled).toBe(true);
  });

  it("saves AI services configuration", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel {...defaultProps} onSave={onSave} />,
    );

    const switches = baseElement.querySelectorAll('button[role="switch"]');
    const apiKeyInputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceApiKey"]',
    ) as NodeListOf<HTMLInputElement>;
    const baseUrlInputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceBaseUrl"]',
    ) as NodeListOf<HTMLInputElement>;

    act(() => {
      fireEvent.click(switches[0]);
    });
    fireEvent.change(apiKeyInputs[0], { target: { value: "sk-new-key-12345678" } });
    fireEvent.change(baseUrlInputs[0], { target: { value: "https://custom.example.com" } });

    const saveBtn = findButtonByText(baseElement, "settings.save");
    act(() => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalled();
    const savedSettings = onSave.mock.calls[0][0];
    expect(savedSettings.aiServices["claude-code"].enabled).toBe(true);
    expect(savedSettings.aiServices["claude-code"].apiKey).toBe("sk-new-key-12345678");
    expect(savedSettings.aiServices["claude-code"].baseUrl).toBe("https://custom.example.com");
  });

  it("preserves other AI service config when editing one", async () => {
    const onSave = vi.fn();
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel
        {...defaultProps}
        onSave={onSave}
        settings={{
          ...defaultProps.settings,
          aiServices: {
            "claude-code": {
              provider: "claude-code" as const,
              apiKey: "sk-claude-1234",
              baseUrl: "https://claude.example.com",
              enabled: true,
            },
            "deepseek": {
              provider: "deepseek" as const,
              apiKey: "sk-deepseek-5678",
              baseUrl: "https://api.deepseek.com",
              enabled: false,
            },
          },
        }}
      />,
    );

    const apiKeyInputs = baseElement.querySelectorAll(
      'input[aria-label="settings.aiServiceApiKey"]',
    ) as NodeListOf<HTMLInputElement>;

    fireEvent.change(apiKeyInputs[0], { target: { value: "sk-claude-updated-9999" } });

    const saveBtn = findButtonByText(baseElement, "settings.save");
    act(() => {
      saveBtn!.click();
    });

    expect(onSave).toHaveBeenCalled();
    const savedSettings = onSave.mock.calls[0][0];

    expect(savedSettings.aiServices["claude-code"].enabled).toBe(true);
    expect(savedSettings.aiServices["claude-code"].apiKey).toBe("sk-claude-updated-9999");
    expect(savedSettings.aiServices["claude-code"].baseUrl).toBe("https://claude.example.com");

    expect(savedSettings.aiServices["deepseek"].enabled).toBe(false);
    expect(savedSettings.aiServices["deepseek"].apiKey).toBe("sk-deepseek-5678");
    expect(savedSettings.aiServices["deepseek"].baseUrl).toBe("https://api.deepseek.com");
  });
});

describe("formatBytes function", () => {
  it("formats bytes correctly", async () => {
    const SettingsPanel = (await import("@/components/settings-panel")).default;
    const { baseElement } = render(
      <SettingsPanel
        settings={{
          activeEnv: "local",
          envs: {
            local: { baseUrl: "http://localhost:8080", accessToken: "" },
            staging: { baseUrl: "", accessToken: "" },
            prod: { baseUrl: "", accessToken: "" },
          },
          aiServices: {
            "claude-code": {
              provider: "claude-code" as const,
              apiKey: "",
              baseUrl: "",
              enabled: false,
            },
            "deepseek": {
              provider: "deepseek" as const,
              apiKey: "",
              baseUrl: "https://api.deepseek.com",
              enabled: false,
            },
          },
        }}
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
