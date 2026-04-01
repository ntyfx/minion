import type { AppSettings, EnvType, Session } from "@/types/chat";

export function getCurrentEnv(settings: AppSettings): EnvType {
  return settings.activeEnv;
}

export function isSessionEnvMismatch(
  session: Pick<Session, "env"> | null,
  currentEnv: EnvType,
): boolean {
  return !!(session?.env && session.env !== currentEnv);
}
