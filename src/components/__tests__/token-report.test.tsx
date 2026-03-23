import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, waitFor, cleanup } from "@testing-library/react";
import {
  formatMonthLabel,
  getMonthRange,
  aggregateByMonth,
  TokenReportToggle,
} from "@/components/token-report";
import {
  lightenColor,
  formatTokenCount,
} from "@/lib/utils";
import type { Session } from "@/types/chat";

vi.mock("@ant-design/charts", () => ({
  Column: () => <div data-testid="mock-column-chart" />,
}));

function makeSession(activity: Session["activity"] = []): Session {
  return {
    id: `s_${Math.random()}`,
    label: "Test",
    messages: [],
    activity,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function makeTokenEvent(timestamp: number, prompt: number, completion: number) {
  return {
    id: `evt_${Math.random()}`,
    type: "token_usage" as const,
    timestamp,
    payload: { prompt_tokens: prompt, completion_tokens: completion },
  };
}

describe("lightenColor", () => {
  it("lightens black toward white by default 40%", () => {
    const result = lightenColor("#000000");
    expect(result).toBe("#666666");
  });

  it("returns white when input is white", () => {
    expect(lightenColor("#ffffff")).toBe("#ffffff");
  });

  it("respects custom amount", () => {
    const result = lightenColor("#000000", 1.0);
    expect(result).toBe("#ffffff");
  });

  it("lightens a color correctly", () => {
    const result = lightenColor("#10b981", 0.4);
    const r = parseInt(result.slice(1, 3), 16);
    const g = parseInt(result.slice(3, 5), 16);
    const b = parseInt(result.slice(5, 7), 16);
    expect(r).toBeGreaterThan(0x10);
    expect(g).toBeGreaterThan(0xb9);
    expect(b).toBeGreaterThan(0x81);
  });
});

describe("formatTokenCount", () => {
  it("formats millions", () => {
    expect(formatTokenCount(1_500_000)).toBe("1.5M");
  });

  it("formats thousands", () => {
    expect(formatTokenCount(42_300)).toBe("42.3k");
  });

  it("formats small numbers as-is", () => {
    expect(formatTokenCount(999)).toBe("999");
    expect(formatTokenCount(0)).toBe("0");
  });

  it("formats exactly 1000 as 1.0k", () => {
    expect(formatTokenCount(1000)).toBe("1.0k");
  });

  it("formats exactly 1M", () => {
    expect(formatTokenCount(1_000_000)).toBe("1.0M");
  });
});

describe("formatMonthLabel", () => {
  it("returns locale-aware month+year for en-US", () => {
    const label = formatMonthLabel(0, "en-US");
    const now = new Date();
    expect(label).toContain(String(now.getFullYear()));
  });

  it("returns locale-aware month+year for zh-CN", () => {
    const label = formatMonthLabel(0, "zh-CN");
    const now = new Date();
    expect(label).toContain(String(now.getFullYear()));
  });

  it("handles negative offset (previous month)", () => {
    const label = formatMonthLabel(-1, "en-US");
    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    expect(label).toContain(String(prev.getFullYear()));
  });
});

describe("getMonthRange", () => {
  it("returns start and end of current month for offset 0", () => {
    const { start, end } = getMonthRange(0);
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();

    expect(startDate.getDate()).toBe(1);
    expect(startDate.getMonth()).toBe(now.getMonth());
    expect(startDate.getFullYear()).toBe(now.getFullYear());

    expect(endDate.getMonth()).toBe(now.getMonth());
    expect(endDate.getDate()).toBeGreaterThanOrEqual(28);
  });

  it("returns previous month for offset -1", () => {
    const { start } = getMonthRange(-1);
    const startDate = new Date(start);
    const expected = new Date();
    expected.setMonth(expected.getMonth() - 1);

    expect(startDate.getMonth()).toBe(expected.getMonth());
  });

  it("end is always >= start", () => {
    for (const offset of [-3, -1, 0]) {
      const { start, end } = getMonthRange(offset);
      expect(end).toBeGreaterThan(start);
    }
  });
});

describe("aggregateByMonth", () => {
  it("returns empty records with zero totals for no sessions", () => {
    const result = aggregateByMonth([], 0, { prompt: "P", completion: "C" });
    expect(result.totalPrompt).toBe(0);
    expect(result.totalCompletion).toBe(0);
    expect(result.records.length).toBeGreaterThan(0);
  });

  it("generates a record pair for every day of the month", () => {
    const result = aggregateByMonth([], 0, { prompt: "P", completion: "C" });
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    expect(result.records.length).toBe(daysInMonth * 2);
  });

  it("aggregates token usage from session activity", () => {
    const { start } = getMonthRange(0);
    const midMonth = start + 5 * 86_400_000;

    const session = makeSession([
      makeTokenEvent(midMonth, 100, 50),
      makeTokenEvent(midMonth + 1000, 200, 75),
    ]);

    const result = aggregateByMonth([session], 0, { prompt: "P", completion: "C" });
    expect(result.totalPrompt).toBe(300);
    expect(result.totalCompletion).toBe(125);
  });

  it("uses provided labels for type field", () => {
    const result = aggregateByMonth([], 0, { prompt: "提示词", completion: "补全" });
    const types = new Set(result.records.map((r) => r.type));
    expect(types).toContain("提示词");
    expect(types).toContain("补全");
  });

  it("ignores events outside the target month", () => {
    const { start } = getMonthRange(0);
    const beforeMonth = start - 86_400_000;

    const session = makeSession([makeTokenEvent(beforeMonth, 999, 999)]);
    const result = aggregateByMonth([session], 0, { prompt: "P", completion: "C" });
    expect(result.totalPrompt).toBe(0);
    expect(result.totalCompletion).toBe(0);
  });
});

describe("TokenReportToggle component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the report button", () => {
    const { container } = render(<TokenReportToggle sessions={[]} />);
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.openReport"]',
    );
    expect(btn).toBeTruthy();
  });

  it("opens modal when button is clicked", async () => {
    const { container, baseElement } = render(<TokenReportToggle sessions={[]} />);
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.openReport"]',
    )!;

    act(() => {
      btn.click();
    });

    await waitFor(() => {
      expect(baseElement.querySelector(".ant-modal")).toBeTruthy();
      expect(baseElement.textContent).toContain("tokenReport.title");
    });
  });

  it("shows empty state when no token data", async () => {
    const { container, baseElement } = render(<TokenReportToggle sessions={[]} />);
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.openReport"]',
    )!;

    act(() => {
      btn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("tokenReport.noData");
    });
  });

  it("shows hero section with token data", async () => {
    const { start } = getMonthRange(0);
    const session = makeSession([makeTokenEvent(start + 86_400_000, 5000, 2000)]);

    const { container, baseElement } = render(<TokenReportToggle sessions={[session]} />);
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.openReport"]',
    )!;

    act(() => {
      btn.click();
    });

    await waitFor(() => {
      expect(baseElement.textContent).toContain("7.0k");
    });
  });

  it("navigates to previous month", async () => {
    const { container, baseElement } = render(<TokenReportToggle sessions={[]} />);
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.openReport"]',
    )!;

    act(() => {
      btn.click();
    });

    await waitFor(() => {
      expect(baseElement.querySelector(".ant-modal")).toBeTruthy();
    });

    const prevBtn = baseElement.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.previousMonth"]',
    )!;
    expect(prevBtn).toBeTruthy();

    act(() => {
      prevBtn.click();
    });

    const prev = new Date();
    prev.setMonth(prev.getMonth() - 1);
    const prevYear = String(prev.getFullYear());

    await waitFor(() => {
      expect(baseElement.textContent).toContain(prevYear);
    });
  });

  it("disables next month button when on current month", async () => {
    const { container, baseElement } = render(<TokenReportToggle sessions={[]} />);
    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="tokenReport.openReport"]',
    )!;

    act(() => {
      btn.click();
    });

    await waitFor(() => {
      const nextBtn = baseElement.querySelector<HTMLButtonElement>(
        'button[aria-label="tokenReport.nextMonth"]',
      );
      expect(nextBtn).toBeTruthy();
      expect(nextBtn!.disabled).toBe(true);
    });
  });
});
