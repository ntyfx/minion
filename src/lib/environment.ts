import type { EnvType } from "@/types/chat";

export type { EnvType };

const LOCAL_RE = /\blocalhost\b|127\.0\.0\.1|\[::1\]/i;
const STAGING_RE = /\bstg\b|\bstging\b|\bstaging\b/i;

export function detectEnvFromUrl(url: string): EnvType {
  if (!url) return "local";
  if (LOCAL_RE.test(url)) return "local";
  if (STAGING_RE.test(url)) return "staging";
  return "prod";
}

export const ENV_COLORS: Record<EnvType, string> = {
  local: "#52c41a",
  staging: "#faad14",
  prod: "#f5222d",
};
