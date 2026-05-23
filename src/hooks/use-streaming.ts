"use client";

import { useState, useRef } from "react";
import { useMemoizedFn } from "ahooks";
import {
  streamChat,
  readChunkContent,
  readReasoningContent,
} from "@/lib/sse-client";
import type { SSEEvent } from "@/lib/sse-client";
import { createSession } from "@/lib/sessions";
import { generateMessageId } from "@/lib/sessions";
import type { EnvSettings, Session } from "@/types/chat";

function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

interface UseStreamingOptions {
  activeSessionId: string | null;
  settings: EnvSettings;
  sessionsRef: React.RefObject<Session[]>;
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
  setActiveSessionId: (id: string) => void;
  updateSession: (id: string, updater: (s: Session) => Session) => void;
  onMissingToken: () => void;
  onStreamComplete?: () => void;
}

export function useStreaming({
  activeSessionId,
  settings,
  sessionsRef,
  setSessions,
  setActiveSessionId,
  updateSession,
  onMissingToken,
  onStreamComplete,
}: UseStreamingOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [reasoningContent, setReasoningContent] = useState("");
  const [inputValue, setInputValue] = useState("");

  const controllerRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);

  const handleSend = useMemoizedFn(async (userMessage: string) => {
      if (!activeSessionId || sendingRef.current) return;

      if (!settings.accessToken) {
        onMissingToken();
        return;
      }

      sendingRef.current = true;
      setIsStreaming(true);

      let sessionId = activeSessionId;
      const currentSessions = sessionsRef.current;
      if (!currentSessions.find((s) => s.id === sessionId)) {
        const s = createSession();
        setSessions((prev) => [...prev, s]);
        setActiveSessionId(s.id);
        sessionId = s.id;
      }

      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const isFirstMessage = s.messages.every((m) => m.role !== "user");
          return {
            ...s,
            label: isFirstMessage ? userMessage.slice(0, 32) : s.label,
            messages: [
              ...s.messages,
              {
                id: generateMessageId(),
                role: "user" as const,
                content: userMessage,
                timestamp: Date.now(),
              },
            ],
            activity: [
              ...s.activity,
              {
                id: generateEventId(),
                type: "request",
                payload: {
                  session_id: sessionId,
                  message: userMessage,
                  include_reasoning: true,
                  reasoning_effort: "medium",
                },
                timestamp: Date.now(),
              },
            ],
            updatedAt: Date.now(),
          };
        }),
      );

      setInputValue("");
      setStreamingContent("");
      setReasoningContent("");

      const controller = new AbortController();
      controllerRef.current = controller;

      let assistantText = "";
      let reasoningText = "";
      let doneReceived = false;

      const handler = (event: SSEEvent) => {
        const { type, payload } = event;

        if (type === "chunk") {
          const text = readChunkContent(payload);
          assistantText += text;
          setStreamingContent(assistantText);
          return;
        }

        if (type === "thinking") {
          const text = readReasoningContent(payload);
          reasoningText += text ? ` ${text}` : "";
          setReasoningContent(reasoningText.trimStart());
          updateSession(sessionId, (s) => ({
            ...s,
            activity: [
              ...s.activity,
              { id: generateEventId(), type, payload, timestamp: Date.now() },
            ],
            updatedAt: Date.now(),
          }));
          return;
        }

        if (type === "summary") {
          const text =
            typeof payload.summary === "string"
              ? payload.summary
              : readChunkContent(payload);
          assistantText = text;
          setStreamingContent(text);
          updateSession(sessionId, (s) => ({
            ...s,
            activity: [
              ...s.activity,
              { id: generateEventId(), type, payload, timestamp: Date.now() },
            ],
            updatedAt: Date.now(),
          }));
          return;
        }

        if (type === "error") {
          updateSession(sessionId, (s) => ({
            ...s,
            messages: [
              ...s.messages,
              { id: generateMessageId(), role: "error" as const, content: readChunkContent(payload), timestamp: Date.now() },
            ],
            activity: [
              ...s.activity,
              { id: generateEventId(), type, payload, timestamp: Date.now() },
            ],
            updatedAt: Date.now(),
          }));
          return;
        }

        if (type === "token_usage") {
          updateSession(sessionId, (s) => ({
            ...s,
            activity: [
              ...s.activity,
              { id: generateEventId(), type, payload, timestamp: Date.now() },
            ],
            updatedAt: Date.now(),
          }));
          return;
        }

        if (type === "done") {
          doneReceived = true;
          updateSession(sessionId, (s) => {
            const newMessages = [...s.messages];
            const newActivity = [...s.activity];
            if (reasoningText.trim()) {
              newMessages.push({ id: generateMessageId(), role: "reasoning", content: reasoningText.trim(), timestamp: Date.now() });
            }
            if (assistantText) {
              newMessages.push({ id: generateMessageId(), role: "assistant", content: assistantText, timestamp: Date.now() });
              newActivity.push({ id: generateEventId(), type, payload, timestamp: Date.now() });
            }
            return { ...s, messages: newMessages, activity: newActivity, updatedAt: Date.now() };
          });
          return;
        }

        updateSession(sessionId, (s) => ({
          ...s,
          activity: [
            ...s.activity,
            { id: generateEventId(), type, payload, timestamp: Date.now() },
          ],
          updatedAt: Date.now(),
        }));
      };

      try {
        await streamChat(
          {
            baseUrl: settings.baseUrl,
            accessToken: settings.accessToken,
            sessionId,
            message: userMessage,
          },
          handler,
          controller.signal,
        );

        if (!doneReceived && assistantText) {
          updateSession(sessionId, (s) => {
            const newMessages = [...s.messages];
            if (reasoningText.trim()) {
              newMessages.push({ id: generateMessageId(), role: "reasoning", content: reasoningText.trim(), timestamp: Date.now() });
            }
            newMessages.push({ id: generateMessageId(), role: "assistant", content: assistantText, timestamp: Date.now() });
            return { ...s, messages: newMessages, updatedAt: Date.now() };
          });
        }
      } catch (err) {
        let errMsg: string;
        if (err instanceof DOMException && err.name === "AbortError") {
          errMsg = "Request stopped.";
        } else if (err instanceof TypeError && err.message === "Failed to fetch") {
          errMsg = `Cannot connect to ${settings.baseUrl}. Please check the server is running and the Base URL is correct in Settings.`;
        } else if (err instanceof Error) {
          errMsg = err.message;
        } else {
          errMsg = String(err);
        }
        updateSession(sessionId, (s) => ({
          ...s,
          messages: [
            ...s.messages,
            { id: generateMessageId(), role: "system" as const, content: errMsg, timestamp: Date.now() },
          ],
          activity: [
            ...s.activity,
            { id: generateEventId(), type: "client_error", payload: { error: errMsg }, timestamp: Date.now() },
          ],
          updatedAt: Date.now(),
        }));
      } finally {
        controllerRef.current = null;
        sendingRef.current = false;
        setIsStreaming(false);
        setStreamingContent("");
        setReasoningContent("");
        onStreamComplete?.();
      }
    });

  const handleResend = useMemoizedFn((messageContent: string) => {
    if (!activeSessionId || sendingRef.current) return;
    handleSend(messageContent);
  });

  const handleStop = useMemoizedFn(() => {
    controllerRef.current?.abort();
  });

  return {
    isStreaming,
    streamingContent,
    reasoningContent,
    inputValue,
    setInputValue,
    handleSend,
    handleResend,
    handleStop,
  };
}
