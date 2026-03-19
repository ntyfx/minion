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
      name: "activity.openFeed",
    });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    const { container } = render(
      <ActivityToggle count={3} onClick={onClick} />,
    );

    const btn = container.querySelector<HTMLButtonElement>(
      'button[aria-label="activity.openFeed"]',
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
    expect(baseElement.textContent).toContain("activity.noEvents");
  });

  it("renders event cards and count tag when events exist", async () => {
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
    expect(baseElement.textContent).toContain("2");
    expect(baseElement.textContent).toContain("chunk");
    expect(baseElement.textContent).toContain("done");
  });

  it("hides count tag when no events", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const tags = baseElement.querySelectorAll(".ant-tag");
    expect(tags.length).toBe(0);
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
    expect(baseElement.textContent).toContain("activity.showMore");
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
    ).find((b) => b.textContent?.includes("activity.showMore"));
    expect(showMoreBtn).toBeTruthy();

    act(() => {
      showMoreBtn?.click();
    });
    expect(baseElement.textContent).toContain("activity.showLess");

    const showLessBtn = Array.from(
      baseElement.querySelectorAll<HTMLButtonElement>("button"),
    ).find((b) => b.textContent?.includes("activity.showLess"));
    act(() => {
      showLessBtn?.click();
    });
    expect(baseElement.textContent).toContain("activity.showMore");
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
    ).filter((b) => b.textContent?.includes("activity.showMore"));
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
      'button[aria-label="activity.clearAll"]',
    );
    expect(clearBtn).toBeTruthy();
    act(() => {
      clearBtn?.click();
    });
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("applies eventColor to border of event card", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("error", "test error")]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const card = baseElement.querySelector<HTMLDivElement>(
      'div[style*="border"]',
    );
    expect(card).toBeTruthy();
    expect(card?.style.border).toContain("var(--error)");
  });

  it("applies eventColor-based background to event card", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("done", "completed")]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const card = baseElement.querySelector<HTMLDivElement>(
      'div[style*="background"]',
    );
    expect(card).toBeTruthy();
    expect(card?.style.background).toContain("color-mix");
    expect(card?.style.background).toContain("var(--accent)");
  });

  it("applies eventColor-based gradient to fade overlay for long payloads", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const longPayload = "x".repeat(250);
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("thinking", longPayload)]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const fadeOverlay = baseElement.querySelector<HTMLDivElement>(
      'div[style*="linear-gradient"]',
    );
    expect(fadeOverlay).toBeTruthy();
    expect(fadeOverlay?.style.background).toContain("color-mix");
    expect(fadeOverlay?.style.background).toContain("var(--warning)");
  });
});
