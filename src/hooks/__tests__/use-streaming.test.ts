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
});
