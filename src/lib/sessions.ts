import type { Session, ChatMessage, ActivityEvent } from "@/types/chat";

const STORAGE_KEY = "minion-sessions";
const ACTIVE_KEY = "minion-active-session";

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `sess_${crypto.randomUUID()}`;
  }
  return `sess_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createSession(label?: string): Session {
  const id = generateId();
  return {
    id,
    label: label || `Chat ${new Date().toLocaleString()}`,
    messages: [],
    activity: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSessions(sessions: Session[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function loadActiveSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveSessionId(id: string): void {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function addMessageToSession(
  session: Session,
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  const msg: ChatMessage = {
    id: generateMessageId(),
    role,
    content,
    timestamp: Date.now(),
  };
  session.messages.push(msg);
  session.updatedAt = Date.now();
  return msg;
}

export function addActivityToSession(
  session: Session,
  type: string,
  payload: unknown,
): ActivityEvent {
  const event: ActivityEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type,
    payload,
    timestamp: Date.now(),
  };
  session.activity.push(event);
  session.updatedAt = Date.now();
  return event;
}

export { generateId, generateMessageId };
