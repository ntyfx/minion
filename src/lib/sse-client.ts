import type { SSEChunkPayload, SkillsPayload } from "@/types/chat";

export type SSEEventType =
  | "chunk"
  | "summary"
  | "thinking"
  | "error"
  | "done"
  | "message"
  | (string & {});

export interface SSEEvent {
  type: SSEEventType;
  payload: SSEChunkPayload;
}

export type SSEEventHandler = (event: SSEEvent) => void;

const MAX_ERROR_LENGTH = 200;

function sanitizeErrorText(text: string): string {
  const cleaned = text.replace(/\n/g, " ").trim();
  if (cleaned.length <= MAX_ERROR_LENGTH) return cleaned;
  return `${cleaned.slice(0, MAX_ERROR_LENGTH)}…`;
}

function parseEventData(rawData: string): SSEChunkPayload {
  const trimmed = rawData.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    return { raw: rawData };
  }
}

function processSSEBuffer(
  buffer: string,
  handler: SSEEventHandler,
  flush = false,
): string {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const chunks = normalized.split("\n\n");
  const remainder = flush ? "" : chunks.pop() || "";

  for (const chunk of chunks) {
    const lines = chunk.split("\n");
    let eventType: SSEEventType = "message";
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith(":")) continue;
      if (line.startsWith("event:")) {
        eventType = line.slice(6).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length) {
      handler({
        type: eventType,
        payload: parseEventData(dataLines.join("\n")),
      });
    }
  }

  return remainder;
}

export interface ChatRequest {
  baseUrl: string;
  accessToken: string;
  sessionId: string;
  message: string;
}

export async function streamChat(
  request: ChatRequest,
  handler: SSEEventHandler,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${request.baseUrl}/api/v1/chat`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${request.accessToken}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      session_id: request.sessionId,
      message: request.message,
      include_reasoning: true,
      reasoning_effort: "medium",
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const errorText = await response
      .text()
      .catch(() => response.statusText || "Request failed");
    throw new Error(`HTTP ${response.status}: ${sanitizeErrorText(errorText)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = processSSEBuffer(buffer, handler);
  }

  buffer += decoder.decode();
  processSSEBuffer(buffer, handler, true);
}

export function readChunkContent(payload: SSEChunkPayload): string {
  if (typeof payload === "string") return payload;
  if (typeof payload.content === "string") return payload.content;
  if (typeof payload.chunk === "string") return payload.chunk;
  if (typeof payload.delta === "string") return payload.delta;
  if (typeof payload.summary === "string") return payload.summary;
  if (typeof payload.message === "string") return payload.message;
  return JSON.stringify(payload, null, 2);
}

export function readReasoningContent(payload: SSEChunkPayload): string {
  if (!payload || typeof payload !== "object") return readChunkContent(payload);

  const details = Array.isArray(payload.reasoning_details)
    ? payload.reasoning_details
    : [];
  const parts = details
    .map((detail) => {
      if (!detail || typeof detail !== "object") return "";
      if (typeof detail.text === "string" && detail.text) return detail.text;
      if (typeof detail.summary === "string" && detail.summary)
        return detail.summary;
      if (typeof detail.data === "string" && detail.data.trim())
        return "[encrypted reasoning]";
      return "";
    })
    .filter(Boolean);

  if (parts.length) return parts.join("");
  if (typeof payload.message === "string") return payload.message;
  return readChunkContent(payload);
}

export async function fetchSkills(
  baseUrl: string,
  accessToken: string,
): Promise<SkillsPayload> {
  const response = await fetch(`${baseUrl}/api/v1/skills`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response
      .text()
      .catch(() => response.statusText || "Request failed");
    throw new Error(`HTTP ${response.status}: ${sanitizeErrorText(errorText)}`);
  }

  return response.json();
}
