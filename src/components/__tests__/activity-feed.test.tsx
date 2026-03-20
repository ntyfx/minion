import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, cleanup, fireEvent } from "@testing-library/react";
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

  it("applies eventColor to dot of event card", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("error", "test error")]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const dot = baseElement.querySelector<HTMLDivElement>(".activity-card-dot");
    expect(dot).toBeTruthy();
    expect(dot?.style.background).toBe("var(--error)");
  });

  it("applies eventColor to event label text", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("done", "completed")]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const card = baseElement.querySelector<HTMLDivElement>(".activity-card");
    expect(card).toBeTruthy();
    const label = card?.querySelector<HTMLElement>(".ant-typography");
    expect(label?.style.color).toBe("var(--accent)");
  });

  it("applies fade overlay gradient for long payloads", async () => {
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
    expect(fadeOverlay?.style.background).toContain("linear-gradient");
    expect(fadeOverlay?.style.background).toContain("var(--bg-elevated)");
  });

  it("exports activity as JSON via blob URL and anchor click", async () => {
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const realCreate = document.createElement.bind(document);
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const a = realCreate("a");
        a.click = click;
        return a;
      }
      return realCreate(tag);
    });

    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const events = [makeEvent("chunk", { x: 1 })];
    const { baseElement } = render(
      <ActivityFeed
        events={events}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );

    const exportBtn = baseElement
      .querySelector(".anticon-export")
      ?.closest("button");
    expect(exportBtn).toBeTruthy();
    act(() => {
      exportBtn!.click();
    });

    expect(createUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalledWith("blob:mock");

    vi.restoreAllMocks();
  });

  it("filters events when Segmented filter changes", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const events = [
      makeEvent("chunk", "data-a"),
      makeEvent("thinking", "think-b"),
    ];
    const { baseElement } = render(
      <ActivityFeed
        events={events}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );

    expect(baseElement.textContent).toContain("think-b");

    const thinkingLabel = screen.getByText("activity.filterThinking");
    const thinkingOption =
      thinkingLabel.closest("label") ??
      thinkingLabel.closest('[role="tab"]') ??
      thinkingLabel.parentElement;
    expect(thinkingOption).toBeTruthy();
    fireEvent.click(thinkingOption!);

    expect(baseElement.textContent).toContain("think-b");
    expect(baseElement.textContent).not.toContain("data-a");
  });

  it("renders token_usage events with formatted token summary (formatTokenPayload)", async () => {
    const ActivityFeed = (await import("@/components/activity-feed")).default;
    const payload = {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
      tools_count: 2,
    };
    const { baseElement } = render(
      <ActivityFeed
        events={[makeEvent("token_usage", payload)]}
        onClear={vi.fn()}
        open={true}
        onToggle={vi.fn()}
      />,
    );
    const pre = baseElement.querySelector("pre");
    expect(pre?.textContent).toContain("Prompt: 10");
    expect(pre?.textContent).toContain("Completion: 20");
    expect(pre?.textContent).toContain("Total: 30");
    expect(pre?.textContent).toContain("Tools: 2");
  });
});
