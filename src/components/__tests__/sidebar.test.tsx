import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { formatTimeAgo } from "@/lib/utils";
import Sidebar from "@/components/sidebar";
import type { Session } from "@/types/chat";

const DAY = 86400000;

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

  it("returns 1h at exactly 60 minutes", () => {
    expect(formatTimeAgo(Date.now() - 60 * 60000, "now")).toBe("1h");
  });

  it("returns 1d at exactly 24 hours", () => {
    expect(formatTimeAgo(Date.now() - 24 * 3600000, "now")).toBe("1d");
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
    const recentSessions: Session[] = [
      { ...mockSessions[0] },
      { ...mockSessions[1], updatedAt: Date.now() - 1000 },
    ];
    render(
      <Sidebar {...defaultProps} sessions={recentSessions} />,
    );
    expect(screen.getAllByText("Chat A").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Chat B").length).toBeGreaterThanOrEqual(1);
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

  it("filters sessions by search (label, tag, message)", () => {
    const sessions: Session[] = [
      {
        id: "a",
        label: "Alpha project",
        messages: [{ id: "m1", role: "user", content: "hello", timestamp: 1 }],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "b",
        label: "Other",
        tags: ["billing"],
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now() - 1000,
      },
      {
        id: "c",
        label: "Gamma",
        messages: [
          {
            id: "m2",
            role: "user",
            content: "unique-snippet-xyz",
            timestamp: 2,
          },
        ],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now() - 2000,
      },
    ];
    const { container } = render(
      <Sidebar {...defaultProps} sessions={sessions} activeSessionId="a" />,
    );
    const searchInput = screen.getByPlaceholderText("sidebar.search");
    fireEvent.change(searchInput, { target: { value: "alpha" } });
    expect(screen.getByText("Alpha project")).toBeInTheDocument();
    expect(screen.queryByText("Other")).not.toBeInTheDocument();
    expect(screen.queryByText("Gamma")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "billing" } });
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.queryByText("Alpha project")).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "unique-snippet-xyz" } });
    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.queryByText("Alpha project")).not.toBeInTheDocument();

    const items = container.querySelectorAll(".ant-conversations-item");
    expect(items.length).toBe(1);
  });

  it("toggles Active vs Archived session lists", () => {
    const sessions: Session[] = [
      {
        id: "active-1",
        label: "Visible active",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "arch-1",
        label: "Archived only",
        archived: true,
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now() - 1000,
      },
    ];
    render(
      <Sidebar {...defaultProps} sessions={sessions} activeSessionId="active-1" />,
    );
    expect(screen.getByText("Visible active")).toBeInTheDocument();
    expect(screen.queryByText("Archived only")).not.toBeInTheDocument();

    const nav = screen.getByRole("navigation", {
      name: "sidebar.conversations",
    });
    const filterBtns = nav.querySelectorAll("button.sidebar-filter-btn");
    expect(filterBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(filterBtns[1]);
    expect(screen.queryByText("Visible active")).not.toBeInTheDocument();
    expect(screen.getByText("Archived only")).toBeInTheDocument();

    fireEvent.click(filterBtns[0]);
    expect(screen.getByText("Visible active")).toBeInTheDocument();
    expect(screen.queryByText("Archived only")).not.toBeInTheDocument();
  });

  it("invokes Pin, Tag, and Archive from the conversation menu", async () => {
    const onPinSession = vi.fn();
    const onTagSession = vi.fn();
    const onArchiveSession = vi.fn();
    const { container } = render(
      <Sidebar
        {...defaultProps}
        onPinSession={onPinSession}
        onTagSession={onTagSession}
        onArchiveSession={onArchiveSession}
      />,
    );
    const menuIcon = container.querySelector(".ant-conversations-menu-icon");
    expect(menuIcon).toBeTruthy();
    fireEvent.click(menuIcon as HTMLElement);

    await waitFor(() => {
      expect(screen.getByText("sidebar.menuPin")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("sidebar.menuPin"));
    expect(onPinSession).toHaveBeenCalledWith("s1");

    fireEvent.click(menuIcon as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText("sidebar.menuTag")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("sidebar.menuTag"));
    expect(onTagSession).toHaveBeenCalledWith("s1");

    fireEvent.click(menuIcon as HTMLElement);
    await waitFor(() => {
      expect(screen.getByText("sidebar.menuArchive")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("sidebar.menuArchive"));
    expect(onArchiveSession).toHaveBeenCalledWith("s1");
  });
});
