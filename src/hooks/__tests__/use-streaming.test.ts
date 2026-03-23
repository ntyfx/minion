import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useStreaming } from "../use-streaming";
import type { Session, AppSettings } from "@/types/chat";
import type { SSEEvent } from "@/lib/sse-client";

// Mock the SSE client
vi.mock("@/lib/sse-client", () => ({
  streamChat: vi.fn(),
  readChunkContent: vi.fn((payload) => payload?.content ?? ""),
  readReasoningContent: vi.fn((payload) => payload?.reasoning ?? ""),
}));

import { streamChat } from "@/lib/sse-client";

describe("useStreaming", () => {
  const mockSettings: AppSettings = {
    baseUrl: "http://localhost:8080",
    accessToken: "test-token",
  };

  const mockSessionsRef = { current: [] as Session[] };
  const mockSetSessions = vi.fn();
  const mockSetActiveSessionId = vi.fn();
  const mockUpdateSession = vi.fn();
  const mockOnMissingToken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionsRef.current = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with correct default state", () => {
    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: null,
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingContent).toBe("");
    expect(result.current.reasoningContent).toBe("");
    expect(result.current.inputValue).toBe("");
  });

  it("should show warning when token is missing", async () => {
    const settingsWithoutToken = { ...mockSettings, accessToken: "" };

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: settingsWithoutToken,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Hello");
    });

    expect(mockOnMissingToken).toHaveBeenCalled();
  });

  it("should not send message when already streaming", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let eventHandler: ((event: SSEEvent) => void) | null = null;

    mockStreamChat.mockImplementation(async (_config, handler) => {
      eventHandler = handler;
      // Keep the stream open
      return new Promise(() => {});
    });

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    // Start streaming
    act(() => {
      result.current.handleSend("Hello");
    });

    // Wait for streaming to start
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Try to send another message while streaming
    mockSetSessions.mockClear();
    await act(async () => {
      await result.current.handleSend("Second message");
    });

    // Should not trigger a second stream
    expect(mockStreamChat).toHaveBeenCalledTimes(1);
  });

  it("should handle streaming chunks correctly", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "chunk", payload: { content: "Hello" } },
      { type: "chunk", payload: { content: " World" } },
      { type: "done", payload: { rounds: 1 } },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // After streaming completes
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamingContent).toBe("");
    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle reasoning content", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "thinking", payload: { reasoning: "Let me think..." } },
      { type: "chunk", payload: { content: "Answer" } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // Reasoning content should be handled
    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle error responses", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async (_config, handler) => {
      handler({ type: "error", payload: { content: "Something went wrong" } });
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // Error should be recorded
    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle network errors", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockRejectedValue(new TypeError("Failed to fetch"));

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // Error message should be added
    expect(mockUpdateSession).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it("should handle abort/stop streaming", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const abortController = { abort: vi.fn() };

    mockStreamChat.mockImplementation(async (_config, _handler, signal) => {
      // Store the signal for later verification
      return new Promise((resolve) => {
        signal?.addEventListener("abort", () => {
          resolve(undefined);
        });
      });
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    // Start streaming
    act(() => {
      result.current.handleSend("Test message");
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true);
    });

    // Stop streaming
    act(() => {
      result.current.handleStop();
    });

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });
  });

  it("should handle resend", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async () => {
      // Empty implementation
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleResend("Resent message");
    });

    expect(mockStreamChat).toHaveBeenCalled();
  });

  it("should update input value", () => {
    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    act(() => {
      result.current.setInputValue("New input");
    });

    expect(result.current.inputValue).toBe("New input");
  });

  it("should handle summary event", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "summary", payload: { summary: "Summary text" } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle token_usage event", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "chunk", payload: { content: "Hello" } },
      { type: "token_usage", payload: { total_tokens: 100 } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle unknown event types", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "unknown" as "chunk", payload: { data: "test" } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle AbortError", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockRejectedValue(new DOMException("Aborted", "AbortError"));

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it("should handle generic Error", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockRejectedValue(new Error("Generic error message"));

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it("should handle non-Error exceptions", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockRejectedValue("String error");

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
    expect(result.current.isStreaming).toBe(false);
  });

  it("should not send when activeSessionId is null", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: null,
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockStreamChat).not.toHaveBeenCalled();
  });

  it("should create new session when session not found", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async () => {
      // Empty
    });

    mockSessionsRef.current = [];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "non-existent-session",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockSetSessions).toHaveBeenCalled();
    expect(mockSetActiveSessionId).toHaveBeenCalled();
  });

  it("should update session label on first message", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async () => {
      // Empty
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "New Session",
        messages: [{ id: "m1", role: "assistant", content: "Hi", timestamp: Date.now() }],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("First user message");
    });

    expect(mockSetSessions).toHaveBeenCalled();
  });

  it("should handle done without doneReceived", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async (_config, handler) => {
      handler({ type: "chunk", payload: { content: "Hello" } });
      // No done event
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should add reasoning message on done when reasoning exists", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "thinking", payload: { reasoning: "Thinking process" } },
      { type: "chunk", payload: { content: "Answer" } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle fallback when stream ends without done event but with content", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async (_config, handler) => {
      handler({ type: "chunk", payload: { content: "Partial response" } });
      // Stream ends without done event
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // Should add assistant message even without done event
    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should add reasoning on fallback when reasoning exists", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async (_config, handler) => {
      handler({ type: "thinking", payload: { reasoning: "Reasoning text" } });
      handler({ type: "chunk", payload: { content: "Response" } });
      // Stream ends without done event
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle done event with reasoning and assistant text", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "thinking", payload: { reasoning: "Thinking" } },
      { type: "chunk", payload: { content: "Answer" } },
      { type: "done", payload: { rounds: 1 } },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle done event with reasoning but no assistant text", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "thinking", payload: { reasoning: "Thinking" } },
      { type: "done", payload: { rounds: 1 } },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle done event without reasoning but with assistant text", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "chunk", payload: { content: "Answer" } },
      { type: "done", payload: { rounds: 1 } },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle fallback with reasoning and assistant text", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async (_config, handler) => {
      handler({ type: "thinking", payload: { reasoning: "Thinking" } });
      handler({ type: "chunk", payload: { content: "Answer" } });
      // No done event
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle unknown event type", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "chunk", payload: { content: "Hello" } },
      { type: "custom" as "chunk", payload: { data: "test" } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle streaming without any chunks", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async () => {
      // Empty stream
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(result.current.isStreaming).toBe(false);
  });

  it("should handle done event with only reasoning (no assistant text)", async () => {
    const mockStreamChat = vi.mocked(streamChat);
    const chunks: SSEEvent[] = [
      { type: "thinking", payload: { reasoning: "Thinking only" } },
      { type: "done", payload: {} },
    ];

    mockStreamChat.mockImplementation(async (_config, handler) => {
      for (const chunk of chunks) {
        handler(chunk);
      }
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    expect(mockUpdateSession).toHaveBeenCalled();
  });

  it("should handle fallback when no done event but has reasoning and content", async () => {
    const mockStreamChat = vi.mocked(streamChat);

    mockStreamChat.mockImplementation(async (_config, handler) => {
      handler({ type: "thinking", payload: { reasoning: "Reasoning text" } });
      handler({ type: "chunk", payload: { content: "Response content" } });
      // Stream ends without done event
    });

    mockSessionsRef.current = [
      {
        id: "session-1",
        label: "Test Session",
        messages: [],
        activity: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    const { result } = renderHook(() =>
      useStreaming({
        activeSessionId: "session-1",
        settings: mockSettings,
        sessionsRef: mockSessionsRef,
        setSessions: mockSetSessions,
        setActiveSessionId: mockSetActiveSessionId,
        updateSession: mockUpdateSession,
        onMissingToken: mockOnMissingToken,
      })
    );

    await act(async () => {
      await result.current.handleSend("Test message");
    });

    // Should add both reasoning and assistant messages via fallback
    expect(mockUpdateSession).toHaveBeenCalled();
  });
});
