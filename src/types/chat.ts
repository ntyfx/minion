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
  | "message"
  | "token_usage";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType | (string & {});
  payload: unknown;
  timestamp: number;
}

export interface Session {
  id: string;
  label: string;
  icon?: string;
  tags?: string[];
  pinned?: boolean;
  archived?: boolean;
  messages: ChatMessage[];
  activity: ActivityEvent[];
  createdAt: number;
  updatedAt: number;
}

export interface SkillItem {
  name: string;
  status: string;
  active_version?: string;
  description?: string;
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
  
  // Token usage fields
  round?: number;
  phase?: string;
  usage_source?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  tools_count?: number;
  
  // Done event fields
  rounds?: number;
  
  [key: string]: unknown;
}

export interface ReasoningDetail {
  type?: string;
  format?: string;
  summary?: string;
  text?: string;
  id?: string;
  data?: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  rounds: number;
  toolsCalls: number;
}

export interface AppSettings {
  baseUrl: string;
  accessToken: string;
}
