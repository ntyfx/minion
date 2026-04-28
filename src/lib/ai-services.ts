import type { AIServiceProvider, AIServiceConfig } from "@/types/chat";

export const AI_SERVICE_CONFIGS: Record<AIServiceProvider, {
  defaultBaseUrl: string;
  labelKey: string;
  descKey: string;
}> = {
  "claude-code": {
    defaultBaseUrl: "",
    labelKey: "aiServiceClaudeCode",
    descKey: "aiServiceClaudeCodeDesc",
  },
  "deepseek": {
    defaultBaseUrl: "https://api.deepseek.com",
    labelKey: "aiServiceDeepSeek",
    descKey: "aiServiceDeepSeekDesc",
  },
};

export function getAIServiceProviders(): AIServiceProvider[] {
  return Object.keys(AI_SERVICE_CONFIGS) as AIServiceProvider[];
}

export function createDefaultAIServiceConfig(provider: AIServiceProvider): AIServiceConfig {
  return {
    provider,
    apiKey: "",
    baseUrl: AI_SERVICE_CONFIGS[provider].defaultBaseUrl,
    enabled: false,
  };
}

export function createDefaultAIServices(): Record<AIServiceProvider, AIServiceConfig> {
  const services = {} as Record<AIServiceProvider, AIServiceConfig>;
  getAIServiceProviders().forEach((provider) => {
    services[provider] = createDefaultAIServiceConfig(provider);
  });
  return services;
}
