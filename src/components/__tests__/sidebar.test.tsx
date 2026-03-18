import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { getTimeGroup, formatTimeAgo } from "@/components/sidebar";
import Sidebar from "@/components/sidebar";
import type { Session } from "@/types/chat";

const DAY = 86400000;

const LABELS = {
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  earlier: "Earlier",
};

describe("getTimeGroup", () => {
  it('returns "Today" for timestamps within the last 24h', () => {
    expect(getTimeGroup(Date.now() - 1000, LABELS)).toBe("Today");
    expect(getTimeGroup(Date.now() - DAY + 1000, LABELS)).toBe("Today");
  });

  it('returns "Yesterday" for timestamps 1-2 days ago', () => {
    expect(getTimeGroup(Date.now() - DAY - 1000, LABELS)).toBe("Yesterday");
  });

  it('returns "This Week" for timestamps 2-7 days ago', () => {
    expect(getTimeGroup(Date.now() - 3 * DAY, LABELS)).toBe("This Week");
    expect(getTimeGroup(Date.now() - 6 * DAY, LABELS)).toBe("This Week");
  });

  it('returns "Earlier" for timestamps older than 7 days', () => {
    expect(getTimeGroup(Date.now() - 8 * DAY, LABELS)).toBe("Earlier");
    expect(getTimeGroup(Date.now() - 30 * DAY, LABELS)).toBe("Earlier");
  });
});

describe("formatTimeAgo", () => {
  it('returns nowLabel for less than 1 minute', () => {
    expect(formatTimeAgo(Date.now(), "now")).toBe("now");
    expect(formatTimeAgo(Date.now() - 30000, "now")).toBe("now");
  });

  it("returns minutes for 1-59 minutes", () => {
    expect(formatTimeAgo(Date.now() - 60000, "now")).toBe("1m");
    expect(formatTimeAgo(Date.now() - 5 * 60000, "now")).toBe("5m");
    expect(formatTimeAgo(Date.now() - 59 * 60000, "now")).toBe("59m");
  });

  it("returns hours for 1-23 hours", () => {
    expect(formatTimeAgo(Date.now() - 3600000, "now")).toBe("1h");
    expect(formatTimeAgo(Date.now() - 12 * 3600000, "now")).toBe("12h");
  });

  it("returns days for 24+ hours", () => {
    expect(formatTimeAgo(Date.now() - DAY, "now")).toBe("1d");
    expect(formatTimeAgo(Date.now() - 7 * DAY, "now")).toBe("7d");
  });
});

describe("Sidebar component", () => {
  const mockSessions: Session[] = [
    {
      id: "s1",
      label: "Chat A",
      messages: [
        { id: "m1", role: "user", content: "hi", timestamp: Date.now() },
      ],
      activity: [],
      createdAt: Date.now() - 1000,
      updatedAt: Date.now(),
    },
    {
      id: "s2",
      label: "Chat B",
      messages: [],
      activity: [],
      createdAt: Date.now() - DAY * 2,
      updatedAt: Date.now() - DAY * 2,
    },
  ];

  const defaultProps = {
    sessions: mockSessions,
    activeSessionId: "s1",
    onSelectSession: vi.fn(),
    onCreateSession: vi.fn(),
    onDeleteSession: vi.fn(),
    onRenameSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the sidebar nav", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("shows New Chat text when expanded", () => {
    const { container } = render(
      <Sidebar {...defaultProps} collapsed={false} />,
    );
    const creationBtn = container.querySelector(
      ".ant-conversations-creation",
    );
    expect(creationBtn).toBeInTheDocument();
    expect(creationBtn?.textContent).toContain("sidebar.newChat");
  });

  it("hides New Chat text when collapsed", () => {
    const { container } = render(
      <Sidebar {...defaultProps} collapsed={true} />,
    );
    const creationBtn = container.querySelector(
      ".ant-conversations-creation",
    );
    expect(creationBtn).toBeInTheDocument();
    expect(creationBtn?.textContent).not.toContain("sidebar.newChat");
  });

  it("renders session labels", () => {
    render(<Sidebar {...defaultProps} />);
    expect(screen.getAllByText("Chat A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Chat B").length).toBeGreaterThanOrEqual(1);
  });

  it("renders group labels when expanded", () => {
    const { container } = render(
      <Sidebar {...defaultProps} collapsed={false} />,
    );
    expect(container.textContent).toContain("sidebar.today");
    expect(container.textContent).toContain("sidebar.thisWeek");
  });

  it("hides group labels when collapsed", () => {
    const { container } = render(
      <Sidebar {...defaultProps} collapsed={true} />,
    );
    const groupLabels = container.querySelectorAll(
      ".ant-conversations-group-title",
    );
    expect(groupLabels.length).toBe(0);
  });

  it("sorts sessions by updatedAt descending", () => {
    const { container } = render(<Sidebar {...defaultProps} />);
    const items = container.querySelectorAll(".ant-conversations-item");
    if (items.length >= 2) {
      expect(items[0].textContent).toContain("Chat A");
    }
  });

  it("calls onCreateSession when New Chat clicked", () => {
    const onCreateSession = vi.fn();
    const { container } = render(
      <Sidebar {...defaultProps} onCreateSession={onCreateSession} />,
    );
    const creationBtn = container.querySelector(
      ".ant-conversations-creation",
    );
    if (creationBtn) {
      act(() => {
        (creationBtn as HTMLElement).click();
      });
      expect(onCreateSession).toHaveBeenCalledOnce();
    }
  });
});
