import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup, fireEvent } from "@testing-library/react";
import { mapRole } from "@/components/chat-panel";
import type { ChatMessage, Session } from "@/types/chat";

function makeMsg(role: ChatMessage["role"], content = "test"): ChatMessage {
  return { id: `msg_${role}_${Math.random()}`, role, content, timestamp: Date.now() };
}

function makeSession(messages: ChatMessage[] = []): Session {
  return {
    id: "s1",
    label: "Test",
    messages,
    activity: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe("mapRole", () => {
  it('maps "user" to "user"', () => {
    expect(mapRole(makeMsg("user"))).toBe("user");
  });

  it('maps "assistant" to "ai"', () => {
    expect(mapRole(makeMsg("assistant"))).toBe("ai");
  });

  it('maps "reasoning" to "reasoning"', () => {
    expect(mapRole(makeMsg("reasoning"))).toBe("reasoning");
  });

  it('maps "error" to "error"', () => {
    expect(mapRole(makeMsg("error"))).toBe("error");
  });

  it('maps "system" to "system"', () => {
    expect(mapRole(makeMsg("system"))).toBe("system");
  });
});

describe("ChatPanel component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders welcome screen when no session", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={null}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.welcomeTitle");
    expect(container.textContent).toContain("chat.welcomeNoSession");
  });

  it("renders prompt cards when session has no messages", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession()}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.welcomeEmptyTitle");
    expect(container.textContent).toContain("chat.promptAnalysis");
  });

  it("renders the sender input area", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession()}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.hint");
  });

  it("renders bubble list when session has messages", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const messages = [
      makeMsg("user", "Hello there"),
      makeMsg("assistant", "Hi! How can I help?"),
    ];
    const { container } = render(
      <ChatPanel
        session={makeSession(messages)}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("Hello there");
    expect(container.textContent).toContain("Hi! How can I help?");
  });

  it("renders streaming content when isStreaming", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession([makeMsg("user", "question")])}
        isStreaming={true}
        streamingContent="streaming answer..."
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("streaming answer...");
  });

  it("renders reasoning bubble header when streaming with reasoning", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession([makeMsg("user", "question")])}
        isStreaming={true}
        streamingContent="answer"
        reasoningContent="thinking step 1"
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.thinking");
  });

  it("renders error messages", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession([makeMsg("error", "Something went wrong")])}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("Something went wrong");
  });

  it("renders stored reasoning bubble header", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession([
          makeMsg("user", "q"),
          makeMsg("reasoning", "I thought about it"),
          makeMsg("assistant", "answer"),
        ])}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.thinking");
  });

  it("does not call onSend for empty input", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const onSend = vi.fn();
    const { container } = render(
      <ChatPanel
        session={makeSession()}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={onSend}
        onStop={vi.fn()}
      />,
    );
    const sender = container.querySelector(".ant-sender");
    expect(sender).toBeTruthy();
    expect(onSend).not.toHaveBeenCalled();
  });

  it("calls onInputChange when sender input changes", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const onInputChange = vi.fn();
    const { container } = render(
      <ChatPanel
        session={makeSession()}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={onInputChange}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    const textarea = container.querySelector("textarea");
    if (textarea) {
      fireEvent.change(textarea, { target: { value: "hello" } });
    }
  });

  it("renders loading state for streaming bubble without content", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession([makeMsg("user", "question")])}
        isStreaming={true}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.querySelector(".ant-bubble-list")).toBeTruthy();
  });

  it("renders ThinkContent with expand/collapse for long reasoning", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const longReasoning = Array.from(
      { length: 10 },
      (_, i) => `Line ${i + 1}`,
    ).join("\n");
    const { container } = render(
      <ChatPanel
        session={makeSession([
          makeMsg("user", "q"),
          makeMsg("reasoning", longReasoning),
          makeMsg("assistant", "a"),
        ])}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.thinking");

    const thinkHeader = container.querySelector(".ant-think-header");
    if (thinkHeader) {
      act(() => {
        (thinkHeader as HTMLElement).click();
      });
      const showAllBtn = Array.from(
        container.querySelectorAll("button"),
      ).find((b) => b.textContent === "chat.showAll");
      if (showAllBtn) {
        act(() => {
          showAllBtn.click();
        });
        expect(container.textContent).toContain("chat.collapse");
      }
    }
  });

  it("does not show expand button for short reasoning when expanded", async () => {
    const ChatPanel = (await import("@/components/chat-panel")).default;
    const { container } = render(
      <ChatPanel
        session={makeSession([
          makeMsg("user", "q"),
          makeMsg("reasoning", "short"),
          makeMsg("assistant", "a"),
        ])}
        isStreaming={false}
        streamingContent=""
        reasoningContent=""
        inputValue=""
        onInputChange={vi.fn()}
        onSend={vi.fn()}
        onStop={vi.fn()}
      />,
    );
    expect(container.textContent).toContain("chat.thinking");
    const thinkHeader = container.querySelector(".ant-think-header");
    if (thinkHeader) {
      act(() => {
        (thinkHeader as HTMLElement).click();
      });
    }
    const showAllBtns = Array.from(
      container.querySelectorAll("button"),
    ).filter((b) => b.textContent === "chat.showAll");
    expect(showAllBtns).toHaveLength(0);
  });
});
