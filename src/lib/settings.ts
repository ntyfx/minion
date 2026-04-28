import type { AppSettings, EnvSettings, EnvType, AIServiceProvider, AIServiceConfig } from "@/types/chat";
import { detectEnvFromUrl } from "@/lib/environment";
import {
  createDefaultAIServices,
  getAIServiceProviders,
} from "@/lib/ai-services";

const STORAGE_KEYS = {
  baseUrl: "minion-demo-base-url",
  accessToken: "minion-demo-access-token",
  settingsV2: "minion-demo-settings-v2",
} as const;

function preferredDefaultBaseUrl(): string {
  if (typeof window === "undefined") return "http://localhost:8080";
  const { protocol, port, origin } = window.location;
  if (
    (protocol === "http:" || protocol === "https:") &&
    (port === "" || port === "8080")
  ) {
    return origin;
  }
  return "http://localhost:8080";
}

function normalizeBaseUrl(value: string): string {
  const trimmed = (value ?? "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function loadSettings(): AppSettings {
  const defaults = createDefaultSettings();
  if (typeof window === "undefined") return defaults;

  const migrated = mergeLegacySettings(defaults);
  const current = mergeStoredSettings(migrated);
  persistV2(current);
  return current;
}

export function saveSettings(settings: AppSettings): void {
  const merged = mergeSettings(createDefaultSettings(), settings);
  persistV2(merged);
  const active = getActiveEnvSettings(merged);
  localStorage.setItem(STORAGE_KEYS.baseUrl, active.baseUrl);
  localStorage.setItem(STORAGE_KEYS.accessToken, active.accessToken);
}

export function clearToken(): void {
  const settings = loadSettings();
  const activeEnv = settings.activeEnv;
  const next = {
    ...settings,
    envs: {
      ...settings.envs,
      [activeEnv]: {
        ...settings.envs[activeEnv],
        accessToken: "",
      },
    },
  };
  saveSettings(next);
}

export function getActiveEnvSettings(settings: AppSettings): EnvSettings {
  return settings.envs[settings.activeEnv];
}

function createDefaultSettings(): AppSettings {
  return {
    activeEnv: "local",
    envs: {
      local: { baseUrl: preferredDefaultBaseUrl(), accessToken: "" },
      staging: { baseUrl: "", accessToken: "" },
      prod: { baseUrl: "", accessToken: "" },
    },
    aiServices: createDefaultAIServices(),
  };
}

function mergeLegacySettings(defaults: AppSettings): AppSettings {
  const legacyBaseUrl = normalizeBaseUrl(
    localStorage.getItem(STORAGE_KEYS.baseUrl) || "",
  );
  const legacyToken = localStorage.getItem(STORAGE_KEYS.accessToken) || "";
  if (!legacyBaseUrl && !legacyToken) return defaults;
  const envFromUrl = legacyBaseUrl ? detectEnvFromUrl(legacyBaseUrl) : "local";
  const targetEnv: EnvType = envFromUrl;
  const currentTarget = defaults.envs[targetEnv];
  return {
    ...defaults,
    activeEnv: targetEnv,
    envs: {
      ...defaults.envs,
      [targetEnv]: {
        ...currentTarget,
        baseUrl: legacyBaseUrl || currentTarget.baseUrl,
        accessToken: legacyToken,
      },
    },
  };
}

function mergeStoredSettings(base: AppSettings): AppSettings {
  const raw = localStorage.getItem(STORAGE_KEYS.settingsV2);
  if (!raw) return base;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return mergeSettings(base, parsed);
  } catch {
    return base;
  }
}

function mergeAIService(
  base: AIServiceConfig,
  patch: Partial<AIServiceConfig> | undefined,
): AIServiceConfig {
  if (!patch) return base;
  const nextApiKey = (patch.apiKey ?? base.apiKey ?? "").trim();
  const nextBaseUrl = patch.baseUrl !== undefined
    ? normalizeBaseUrl(patch.baseUrl)
    : base.baseUrl;
  const nextEnabled = typeof patch.enabled === "boolean" ? patch.enabled : base.enabled;
  return {
    provider: base.provider,
    apiKey: nextApiKey,
    baseUrl: nextBaseUrl,
    enabled: nextEnabled,
  };
}

const ENV_LIST: EnvType[] = ["local", "staging", "prod"];

function mergeSettings(base: AppSettings, patch: unknown): AppSettings {
  if (!patch || typeof patch !== "object") return base;
  const input = patch as Partial<AppSettings> & {
    envs?: Partial<Record<EnvType, Partial<EnvSettings>>>;
    aiServices?: Partial<Record<AIServiceProvider, Partial<AIServiceConfig>>>;
  };
  const activeEnv = asEnvType(input.activeEnv) ?? base.activeEnv;

  const envs = {} as Record<EnvType, EnvSettings>;
  ENV_LIST.forEach((env) => {
    envs[env] = mergeEnv(
      base.envs[env],
      input.envs?.[env],
      env === "local" ? base.envs.local.baseUrl : ""
    );
  });

  const aiServices = {} as Record<AIServiceProvider, AIServiceConfig>;
  getAIServiceProviders().forEach((provider) => {
    aiServices[provider] = mergeAIService(
      base.aiServices[provider],
      input.aiServices?.[provider]
    );
  });

  return {
    activeEnv,
    envs,
    aiServices,
  };
}

function mergeEnv(
  base: EnvSettings,
  patch: Partial<EnvSettings> | undefined,
  fallbackBaseUrl: string,
): EnvSettings {
  const nextBaseUrl = normalizeBaseUrl(patch?.baseUrl ?? base.baseUrl);
  return {
    baseUrl: nextBaseUrl || fallbackBaseUrl,
    accessToken: (patch?.accessToken ?? base.accessToken ?? "").trim(),
  };
}

function persistV2(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.settingsV2, JSON.stringify(settings));
}

function asEnvType(value: unknown): EnvType | null {
  if (value === "local" || value === "staging" || value === "prod") {
    return value;
  }
  return null;
}

export { preferredDefaultBaseUrl, normalizeBaseUrl };
