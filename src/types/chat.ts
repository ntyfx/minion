export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "reasoning" | "error";
  content: string;
  timestamp: number;
}

export type ActivityEventType =
  | "request"
  | "chunk"
  | "thinking"
  | "summary"
  | "done"
  | "error"
  | "client_error"
  | "message";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType | (string & {});
  payload: unknown;
  timestamp: number;
}

export interface Session {
  id: string;
  label: string;
  messages: ChatMessage[];
  activity: ActivityEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface SkillItem {
  name: string;
  status: string;
}

export interface SkillsPayload {
  active_version?: string;
  loaded_at?: string;
  skills?: SkillItem[];
}

export interface SSEChunkPayload {
  content?: string;
  chunk?: string;
  delta?: string;
  summary?: string;
  message?: string;
  status?: string;
  kind?: string;
  reasoning_details?: ReasoningDetail[];
  raw?: string;
  [key: string]: unknown;
}

export interface ReasoningDetail {
  text?: string;
  summary?: string;
  data?: string;
}

export interface AppSettings {
  baseUrl: string;
  accessToken: string;
}
