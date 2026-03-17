import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, act, cleanup } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/lib/theme";

const STORAGE_KEY = "minion-chat-theme";

function ThemeConsumer() {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setTheme("light")}>set-light</button>
    </div>
  );
}

beforeEach(() => {
  cleanup();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  document.documentElement.style.colorScheme = "";

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("dark"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ThemeProvider", () => {
  it("renders children after mounting", () => {
    const { container } = render(
      <ThemeProvider>
        <span>child</span>
      </ThemeProvider>,
    );
    expect(container.textContent).toContain("child");
  });

  it("reads theme from data-theme attribute", () => {
    document.documentElement.setAttribute("data-theme", "light");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(getByTestId("theme").textContent).toBe("light");
  });

  it("falls back to localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "light");

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(getByTestId("theme").textContent).toBe("light");
  });

  it("falls back to prefers-color-scheme when no stored value", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(getByTestId("theme").textContent).toBe("dark");
  });

  it("toggleTheme switches between dark and light", () => {
    document.documentElement.setAttribute("data-theme", "dark");

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(getByTestId("theme").textContent).toBe("dark");

    act(() => {
      getByText("toggle").click();
    });

    expect(getByTestId("theme").textContent).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("setTheme persists to localStorage", () => {
    document.documentElement.setAttribute("data-theme", "dark");

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      getByText("set-light").click();
    });

    expect(getByTestId("theme").textContent).toBe("light");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("applies theme to document element", () => {
    document.documentElement.setAttribute("data-theme", "light");

    const { getByText } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    act(() => {
      getByText("toggle").click();
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("responds to system prefers-color-scheme change when no stored preference", () => {
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "";
    localStorage.clear();

    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("light"),
      media: query,
      addEventListener: vi.fn(
        (_event: string, handler: (e: MediaQueryListEvent) => void) => {
          capturedHandler = handler;
        },
      ),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(getByTestId("theme").textContent).toBe("light");

    expect(capturedHandler).not.toBeNull();
    act(() => {
      capturedHandler!({ matches: true } as MediaQueryListEvent);
    });

    expect(getByTestId("theme").textContent).toBe("dark");
  });

  it("ignores system prefers-color-scheme change when stored preference exists", () => {
    localStorage.setItem(STORAGE_KEY, "light");

    let capturedHandler: ((e: MediaQueryListEvent) => void) | null = null;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(
        (_event: string, handler: (e: MediaQueryListEvent) => void) => {
          capturedHandler = handler;
        },
      ),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );

    expect(getByTestId("theme").textContent).toBe("light");

    act(() => {
      capturedHandler!({ matches: true } as MediaQueryListEvent);
    });

    expect(getByTestId("theme").textContent).toBe("light");
  });
});
