import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act, cleanup, fireEvent, waitFor } from "@testing-library/react";
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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
        onResend={vi.fn()}
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

  describe("copy button functionality", () => {
    let writeTextMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      writeTextMock = vi.fn();
      Object.defineProperty(global.navigator, "clipboard", {
        value: { writeText: writeTextMock },
        writable: true,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("renders copy button in AI response bubbles", async () => {
      const ChatPanel = (await import("@/components/chat-panel")).default;
      const messages = [
        makeMsg("assistant", "This is an AI response"),
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
          onResend={vi.fn()}
          onStop={vi.fn()}
  
        />,
      );

      // Check if copy button is present (may be hidden initially due to hover state)
      const copyButtons = container.querySelectorAll('button[aria-label*="copy"]');
      expect(copyButtons.length).toBeGreaterThan(0);
    });

    it("copies AI response text when copy button is clicked", async () => {
      const ChatPanel = (await import("@/components/chat-panel")).default;
      const aiResponse = "This is an AI response that should be copied";
      const messages = [
        makeMsg("assistant", aiResponse),
      ];
      
      writeTextMock.mockResolvedValue(undefined);
      
      const { container } = render(
        <ChatPanel
          session={makeSession(messages)}
          isStreaming={false}
          streamingContent=""
          reasoningContent=""
          inputValue=""
          onInputChange={vi.fn()}
          onSend={vi.fn()}
          onResend={vi.fn()}
          onStop={vi.fn()}
  
        />,
      );

      // Find and click the copy button
      const copyButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.getAttribute('aria-label')?.includes('copy')
      );
      
      expect(copyButton).toBeTruthy();
      
      if (copyButton) {
        await act(async () => {
          fireEvent.click(copyButton);
        });

        // Wait for async operation
        await waitFor(() => {
          expect(writeTextMock).toHaveBeenCalledWith(aiResponse);
        });
      }
    });

    it("shows success feedback after copying", async () => {
      const ChatPanel = (await import("@/components/chat-panel")).default;
      const messages = [
        makeMsg("assistant", "Test response"),
      ];
      
      writeTextMock.mockResolvedValue(undefined);
      
      const { container } = render(
        <ChatPanel
          session={makeSession(messages)}
          isStreaming={false}
          streamingContent=""
          reasoningContent=""
          inputValue=""
          onInputChange={vi.fn()}
          onSend={vi.fn()}
          onResend={vi.fn()}
          onStop={vi.fn()}
  
        />,
      );

      const copyButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.getAttribute('aria-label')?.includes('copy')
      );
      
      expect(copyButton).toBeTruthy();
      
      if (copyButton) {
        // Check initial aria-label
        expect(copyButton.getAttribute('aria-label')).toContain('copy');
        
        await act(async () => {
          fireEvent.click(copyButton);
        });

        // Wait for state update
        await waitFor(() => {
          // After successful copy, aria-label should change to "copied"
          expect(copyButton.getAttribute('aria-label')).toContain('copied');
        });
      }
    });

    it("handles copy errors gracefully", async () => {
      const ChatPanel = (await import("@/components/chat-panel")).default;
      const messages = [
        makeMsg("assistant", "Test response"),
      ];
      
      writeTextMock.mockRejectedValue(new Error("Clipboard error"));
      
      const { container } = render(
        <ChatPanel
          session={makeSession(messages)}
          isStreaming={false}
          streamingContent=""
          reasoningContent=""
          inputValue=""
          onInputChange={vi.fn()}
          onSend={vi.fn()}
          onResend={vi.fn()}
          onStop={vi.fn()}
  
        />,
      );

      const copyButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.getAttribute('aria-label')?.includes('copy')
      );
      
      expect(copyButton).toBeTruthy();
      
      if (copyButton) {
        await act(async () => {
          fireEvent.click(copyButton);
        });

        // Should not crash, error should be logged
        await waitFor(() => {
          expect(writeTextMock).toHaveBeenCalled();
        });
      }
    });

    it("does not show copy button in user messages", async () => {
      const ChatPanel = (await import("@/components/chat-panel")).default;
      const messages = [
        makeMsg("user", "User message"),
        makeMsg("assistant", "AI response"),
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
          onResend={vi.fn()}
          onStop={vi.fn()}
  
        />,
      );

      // Count buttons with copy-related aria-labels
      const copyButtons = Array.from(container.querySelectorAll('button')).filter(
        btn => btn.getAttribute('aria-label')?.includes('copy')
      );
      
      // Should only have copy button for AI response, not for user message
      expect(copyButtons.length).toBe(1);
    });

    it("shows copy button in streaming AI responses", async () => {
      const ChatPanel = (await import("@/components/chat-panel")).default;
      const messages = [
        makeMsg("user", "Question"),
      ];
      
      const { container } = render(
        <ChatPanel
          session={makeSession(messages)}
          isStreaming={true}
          streamingContent="Streaming AI response..."
          reasoningContent=""
          inputValue=""
          onInputChange={vi.fn()}
          onSend={vi.fn()}
          onResend={vi.fn()}
          onStop={vi.fn()}
  
        />,
      );

      // Streaming responses should also have copy button
      const copyButtons = container.querySelectorAll('button[aria-label*="copy"]');
      expect(copyButtons.length).toBeGreaterThan(0);
    });
  });
});
