import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";
import { eventColor, formatPayload } from "@/components/activity-feed";
import { ActivityToggle } from "@/components/activity-feed";
import type { ActivityEvent } from "@/types/chat";

describe("eventColor", () => {
  it('returns error var for "error"', () => {
    expect(eventColor("error")).toBe("var(--error)");
  });

  it('returns error var for "client_error"', () => {
    expect(eventColor("client_error")).toBe("var(--error)");
  });

  it('returns accent for "done"', () => {
    expect(eventColor("done")).toBe("var(--accent)");
  });

  it('returns warning var for "thinking"', () => {
    expect(eventColor("thinking")).toBe("var(--warning)");
  });

  it('returns info var for "chunk"', () => {
    expect(eventColor("chunk")).toBe("var(--info)");
  });

  it('returns info var for "summary"', () => {
    expect(eventColor("summary")).toBe("var(--info)");
  });

  it("returns muted for unknown types", () => {
    expect(eventColor("unknown_type")).toBe("var(--text-muted)");
  });
});

describe("formatPayload", () => {
  it("returns string payloads directly", () => {
    expect(formatPayload("hello")).toBe("hello");
  });

  it("stringifies object payloads as JSON", () => {
    const result = formatPayload({ key: "value" });
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });

  it("handles null payload", () => {
    expect(formatPayload(null)).toBe("null");
  });

  it("handles number payload", () => {
    expect(formatPayload(42)).toBe("42");
  });

  it("handles array payload", () => {
    const result = formatPayload([1, 2, 3]);
    expect(result).toContain("1");
    expect(result).toContain("2");
    expect(result).toContain("3");
  });
});

describe("ActivityToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the toggle button", () => {
    render(<ActivityToggle count={0} onClick={vi.fn()} />);
    const buttons = screen.getAllByRole("button", {
      name: "Open activity feed",
    });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    const { container } = render(
      <ActivityToggle count={3} onClick={onClick} />,
    );

    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Open activity feed"]',
    );
    act(() => {
      btn?.click();
    });

    expect(onClick).toHaveBeenCalledOnce();
  });
});

function makeEvent(
  type: string,
  payload: unknown = "test payload",
): ActivityEvent {
  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    payload,
    timestamp: Date.now(),
  };
}

describe("ActivityFeed component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no events", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    expect(baseElement.textContent).toContain("No events yet");
  });

  it("renders event cards when events exist", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const events = [
      makeEvent("chunk", { content: "hello" }),
      makeEvent("done", "finished"),
    ];
    const { baseElement } = render(
      <ActivityFeed
        events={events}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    expect(baseElement.textContent).toContain("2 events");
    expect(baseElement.textContent).toContain("chunk");
    expect(baseElement.textContent).toContain("done");
  });

  it("renders singular event count", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("chunk")]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    expect(baseElement.textContent).toContain("1 event");
  });

  it("shows expand button for long payloads", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const longPayload = "x".repeat(250);
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("chunk", longPayload)]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    expect(baseElement.textContent).toContain("Show more");
  });

  it("toggles expand/collapse on long payload", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const longPayload = "x".repeat(250);
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("chunk", longPayload)]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );

    const showMoreBtn = Array.from(
      baseElement.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent?.includes("Show more"));
    expect(showMoreBtn).toBeTruthy();

    act(() => {
      showMoreBtn?.click();
    });
    expect(baseElement.textContent).toContain("Show less");

    const showLessBtn = Array.from(
      baseElement.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent?.includes("Show less"));
    act(() => {
      showLessBtn?.click();
    });
    expect(baseElement.textContent).toContain("Show more");
  });

  it("does not show expand button for short payloads", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("chunk", "short")]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const expandBtns = Array.from(
      baseElement.querySelectorAll("button"),
    ).filter((b) => b.textContent?.includes("Show more"));
    expect(expandBtns).toHaveLength(0);
  });

  it("calls onClear when clear button clicked", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const onClear = vi.fn();
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("chunk")]}
        onClear={onClear}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const clearBtn = baseElement.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear all events"]',
    );
    expect(clearBtn).toBeTruthy();
    act(() => {
      clearBtn?.click();
    });
    expect(onClear).toHaveBeenCalledOnce();
  });
});
