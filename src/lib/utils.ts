export function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function formatTimeAgo(ts: number, nowLabel: string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return nowLabel;
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

export function lightenColor(hex: string, amount = 0.4): string {
  const raw = hex.replace("#", "");
  const r = parseInt(raw.substring(0, 2), 16);
  const g = parseInt(raw.substring(2, 4), 16);
  const b = parseInt(raw.substring(4, 6), 16);
  const lr = Math.round(r + (255 - r) * amount);
  const lg = Math.round(g + (255 - g) * amount);
  const lb = Math.round(b + (255 - b) * amount);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

export function isNonNullObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export interface SSEChunkPayload {
  content?: string;
  summary?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  tools_count?: number;
  rounds?: number;
  [key: string]: unknown;
}

export function isSSEChunkPayload(value: unknown): value is SSEChunkPayload {
  return isNonNullObject(value);
}

export function getTokenUsage(payload: unknown): {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  tools_count: number;
  rounds: number;
} {
  if (!isNonNullObject(payload)) {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, tools_count: 0, rounds: 0 };
  }

  return {
    prompt_tokens: typeof payload.prompt_tokens === "number" ? payload.prompt_tokens : 0,
    completion_tokens: typeof payload.completion_tokens === "number" ? payload.completion_tokens : 0,
    total_tokens: typeof payload.total_tokens === "number" ? payload.total_tokens : 0,
    tools_count: typeof payload.tools_count === "number" ? payload.tools_count : 0,
    rounds: typeof payload.rounds === "number" ? payload.rounds : 0,
  };
}
