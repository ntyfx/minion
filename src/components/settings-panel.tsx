"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Input, Flex, Typography, Alert, Modal, Tooltip, Select, message, Progress, Switch, Tabs } from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { AppSettings, EnvType, AIServiceProvider, AIServiceConfig } from "@/types/chat";
import { preferredDefaultBaseUrl, normalizeBaseUrl } from "@/lib/settings";
import {
  getAIServiceProviders,
  AI_SERVICE_CONFIGS,
} from "@/lib/ai-services";
import { useAppLocale, LOCALE_LIST, type LocaleId } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { THEME_LIST, type ThemeId } from "@/lib/themes";
import { getStorageEstimate } from "@/lib/session-db";
import { ENV_COLORS } from "@/lib/environment";

interface ValidationErrors {
  [field: string]: string | undefined;
}

function validateApiKey(key: string, t: ReturnType<typeof useTranslations<"settings">>): string | undefined {
  const trimmed = key.trim();
  if (trimmed === "") return undefined;
  if (trimmed.length < 8) {
    return t("validation.apiKeyTooShort");
  }
  return undefined;
}

function validateBaseUrl(url: string, t: ReturnType<typeof useTranslations<"settings">>): string | undefined {
  const trimmed = url.trim();
  if (trimmed === "") return undefined;
  try {
    new URL(normalizeBaseUrl(trimmed));
    return undefined;
  } catch {
    return t("validation.invalidUrl");
  }
}

interface AIServiceConfigPanelProps {
  provider: AIServiceProvider;
  config: AIServiceConfig;
  onToggle: (provider: AIServiceProvider, enabled: boolean) => void;
  onApiKeyChange: (provider: AIServiceProvider, apiKey: string) => void;
  onBaseUrlChange: (provider: AIServiceProvider, baseUrl: string) => void;
  onClearApiKey: (provider: AIServiceProvider) => void;
  validationErrors: ValidationErrors;
}

function AIServiceConfigPanel({
  provider,
  config,
  onToggle,
  onApiKeyChange,
  onBaseUrlChange,
  onClearApiKey,
  validationErrors,
}: AIServiceConfigPanelProps) {
  const t = useTranslations("settings");
  const serviceConfig = AI_SERVICE_CONFIGS[provider];

  const apiKeyError = validationErrors[`${provider}-apiKey`];
  const baseUrlError = validationErrors[`${provider}-baseUrl`];

  return (
    <Flex vertical gap={8} style={{ paddingTop: 12 }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: 4 }}>
        <Typography.Text strong style={{ fontSize: 13 }}>
          {t("aiServiceEnable")}
        </Typography.Text>
        <Switch
          checked={config.enabled}
          onChange={(checked) => onToggle(provider, checked)}
          size="small"
          aria-label={t("aiServiceEnable")}
        />
      </Flex>
      <Input.Password
        value={config.apiKey}
        onChange={(e) => onApiKeyChange(provider, e.target.value)}
        placeholder={t("aiServiceApiKeyPlaceholder")}
        aria-label={t("aiServiceApiKey")}
        disabled={!config.enabled}
        status={apiKeyError ? "error" : undefined}
        suffix={
          <Tooltip title={t("clearToken")}>
            <DeleteOutlined
              onClick={() => onClearApiKey(provider)}
              style={{ color: "var(--text-muted)", cursor: "pointer" }}
              aria-label={t("clearToken")}
            />
          </Tooltip>
        }
      />
      {apiKeyError && (
        <Typography.Text style={{ fontSize: 12, color: "#ff4d4f" }}>
          {apiKeyError}
        </Typography.Text>
      )}
      <Input
        value={config.baseUrl}
        onChange={(e) => onBaseUrlChange(provider, e.target.value)}
        placeholder={t("aiServiceBaseUrlPlaceholder")}
        aria-label={t("aiServiceBaseUrl")}
        disabled={!config.enabled}
        status={baseUrlError ? "error" : undefined}
      />
      {baseUrlError && (
        <Typography.Text style={{ fontSize: 12, color: "#ff4d4f" }}>
          {baseUrlError}
        </Typography.Text>
      )}
      <Typography.Text
        style={{
          fontSize: 12,
          display: "block",
          marginTop: 6,
          color: "var(--text-muted)",
        }}
      >
        {t(serviceConfig.descKey)}
      </Typography.Text>
    </Flex>
  );
}

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  open: boolean;
  onToggle: () => void;
  sessionCount: number;
}

export default function SettingsPanel({
  settings,
  onSave,
  open,
  onToggle,
  sessionCount,
}: SettingsPanelProps) {
  const t = useTranslations("settings");
  const tTheme = useTranslations("theme");
  const tSidebar = useTranslations("sidebar");
  const { locale, setLocale } = useAppLocale();
  const { themeId, setTheme } = useTheme();
  const [draftSettings, setDraftSettings] = useState(settings);
  const [messageApi, contextHolder] = message.useMessage();
  const [storageInfo, setStorageInfo] = useState<{ usage: number; quota: number } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    setDraftSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (open) {
      getStorageEstimate().then(setStorageInfo);
    }
  }, [open]);

  const handleSave = () => {
    onSave(draftSettings);
    messageApi.success(t("saved"));
    onToggle();
  };

  const handleLoadDefaults = () => {
    const activeEnv = draftSettings.activeEnv;
    const defaultUrl = activeEnv === "local" ? preferredDefaultBaseUrl() : "";
    const next = {
      ...draftSettings,
      envs: {
        ...draftSettings.envs,
        [activeEnv]: {
          ...draftSettings.envs[activeEnv],
          baseUrl: defaultUrl,
        },
      },
    };
    setDraftSettings(next);
    onSave(next);
    messageApi.info(t("urlReset"));
  };

  const handleClearToken = () => {
    const activeEnv = draftSettings.activeEnv;
    const next = {
      ...draftSettings,
      envs: {
        ...draftSettings.envs,
        [activeEnv]: {
          ...draftSettings.envs[activeEnv],
          accessToken: "",
        },
      },
    };
    setDraftSettings(next);
    onSave(next);
    messageApi.info(t("tokenCleared"));
  };

  const handleSwitchEnv = (env: EnvType) => {
    setDraftSettings((prev) => ({ ...prev, activeEnv: env }));
  };

  const handleBaseUrlChange = (value: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      envs: {
        ...prev.envs,
        [prev.activeEnv]: {
          ...prev.envs[prev.activeEnv],
          baseUrl: value,
        },
      },
    }));
  };

  const handleTokenChange = (value: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      envs: {
        ...prev.envs,
        [prev.activeEnv]: {
          ...prev.envs[prev.activeEnv],
          accessToken: value,
        },
      },
    }));
  };

  const handleAIServiceToggle = useCallback((provider: AIServiceProvider, enabled: boolean) => {
    setDraftSettings((prev) => ({
      ...prev,
      aiServices: {
        ...prev.aiServices,
        [provider]: {
          ...prev.aiServices[provider],
          enabled,
        },
      },
    }));
  }, []);

  const handleAIServiceApiKeyChange = useCallback((provider: AIServiceProvider, apiKey: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      aiServices: {
        ...prev.aiServices,
        [provider]: {
          ...prev.aiServices[provider],
          apiKey,
        },
      },
    }));

    const error = validateApiKey(apiKey, t);
    setValidationErrors((prev) => ({
      ...prev,
      [`${provider}-apiKey`]: error,
    }));
  }, [t]);

  const handleAIServiceBaseUrlChange = useCallback((provider: AIServiceProvider, baseUrl: string) => {
    setDraftSettings((prev) => ({
      ...prev,
      aiServices: {
        ...prev.aiServices,
        [provider]: {
          ...prev.aiServices[provider],
          baseUrl,
        },
      },
    }));

    const error = validateBaseUrl(baseUrl, t);
    setValidationErrors((prev) => ({
      ...prev,
      [`${provider}-baseUrl`]: error,
    }));
  }, [t]);

  const handleClearAIServiceApiKey = useCallback((provider: AIServiceProvider) => {
    setDraftSettings((prev) => ({
      ...prev,
      aiServices: {
        ...prev.aiServices,
        [provider]: {
          ...prev.aiServices[provider],
          apiKey: "",
        },
      },
    }));
    setValidationErrors((prev) => ({
      ...prev,
      [`${provider}-apiKey`]: undefined,
    }));
    messageApi.info(t("aiServiceApiKeyCleared"));
  }, [t, messageApi]);

  const storagePercent = storageInfo && storageInfo.quota > 0
    ? Math.round((storageInfo.usage / storageInfo.quota) * 100)
    : 0;
  const activeEnvConfig = draftSettings.envs[draftSettings.activeEnv];

  const aiServiceTabs = useMemo(() => {
    return getAIServiceProviders().map((provider) => ({
      key: provider,
      label: t(AI_SERVICE_CONFIGS[provider].labelKey),
      children: (
        <AIServiceConfigPanel
          provider={provider}
          config={draftSettings.aiServices[provider]}
          onToggle={handleAIServiceToggle}
          onApiKeyChange={handleAIServiceApiKeyChange}
          onBaseUrlChange={handleAIServiceBaseUrlChange}
          onClearApiKey={handleClearAIServiceApiKey}
          validationErrors={validationErrors}
        />
      ),
    }));
  }, [
    draftSettings.aiServices,
    validationErrors,
    handleAIServiceToggle,
    handleAIServiceApiKeyChange,
    handleAIServiceBaseUrlChange,
    handleClearAIServiceApiKey,
    t,
  ]);

  return (
    <Modal
      title={t("title")}
      open={open}
      onCancel={onToggle}
      onOk={handleSave}
      okText={t("save")}
      okButtonProps={{ icon: <SaveOutlined /> }}
      width={480}
      centered
      styles={{ body: { paddingTop: 20, paddingBottom: 20 } }}
      footer={(_, { OkBtn, CancelBtn }) => (
        <Flex justify="end" gap={8}>
          <CancelBtn />
          <OkBtn />
        </Flex>
      )}
      data-testid="settings-modal"
    >
      {contextHolder}
      <Flex vertical gap={20}>
        <Flex align="center" justify="space-between">
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("language")}
          </Typography.Text>
          <Select
            value={locale}
            onChange={(val: LocaleId) => setLocale(val)}
            options={LOCALE_LIST.map((l) => ({ value: l.id, label: l.label }))}
            style={{ width: 160 }}
            size="small"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Typography.Text strong style={{ fontSize: 13 }}>
            {t("activeEnv")}
          </Typography.Text>
          <Select
            className="env-switch-select"
            classNames={{ popup: { root: "env-switch-dropdown" } }}
            value={draftSettings.activeEnv}
            onChange={(val) => handleSwitchEnv(val as EnvType)}
            options={[
              {
                value: "local",
                label: (
                  <span className="env-switch-option">
                    <span className="env-switch-dot" style={{ background: ENV_COLORS.local }} />
                    {tSidebar("env_local")}
                  </span>
                ),
              },
              {
                value: "staging",
                label: (
                  <span className="env-switch-option">
                    <span className="env-switch-dot" style={{ background: ENV_COLORS.staging }} />
                    {tSidebar("env_staging")}
                  </span>
                ),
              },
              {
                value: "prod",
                label: (
                  <span className="env-switch-option">
                    <span className="env-switch-dot" style={{ background: ENV_COLORS.prod }} />
                    {tSidebar("env_prod")}
                  </span>
                ),
              },
            ]}
            style={{ width: 160 }}
            size="small"
          />
        </Flex>

        <Flex align="center" justify="space-between">
          <Typography.Text strong style={{ fontSize: 13 }}>
            {tTheme("chooseTheme")}
          </Typography.Text>
          <Flex gap={6} align="center">
            {THEME_LIST.map((tm) => {
              const isActive = tm.id === themeId;
              return (
                <Tooltip
                  key={tm.id}
                  title={tTheme(`themeName.${tm.id}`)}
                  mouseEnterDelay={0.4}
                >
                  <button
                    onClick={() => setTheme(tm.id as ThemeId)}
                    aria-label={tTheme("switchTo", { name: tTheme(`themeName.${tm.id}`) })}
                    aria-pressed={isActive}
                    data-testid={`theme-button-${tm.id}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: isActive
                        ? "2px solid var(--accent)"
                        : "2px solid var(--border)",
                      background: tm.preview.bg,
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "border-color 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: "40%",
                        background: tm.preview.accent,
                        opacity: 0.8,
                        borderRadius: "0 0 50% 50%",
                      }}
                    />
                    {isActive && (
                      <CheckOutlined
                        style={{
                          fontSize: 10,
                          color: tm.preview.text,
                          position: "relative",
                          zIndex: 1,
                        }}
                      />
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </Flex>
        </Flex>

        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
            margin: 0,
          }}
        >
          <legend
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              padding: "0 4px",
            }}
          >
            {t("apiBaseUrl")}
          </legend>
          <Alert
            title={t("alertInfo")}
            type="info"
            showIcon
            banner
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 12, borderRadius: 8 }}
          />
          <Input
            value={activeEnvConfig.baseUrl}
            onChange={(e) => handleBaseUrlChange(e.target.value)}
            placeholder={t("apiBaseUrlPlaceholder")}
            aria-label={t("apiBaseUrl")}
            suffix={
              <Tooltip title={t("resetToDefault")}>
                <UndoOutlined
                  onClick={handleLoadDefaults}
                  style={{ color: "var(--text-muted)", cursor: "pointer" }}
                  aria-label={t("resetUrl")}
                />
              </Tooltip>
            }
            style={{ marginBottom: 8 }}
          />
          <Typography.Text
            style={{
              fontSize: 12,
              display: "block",
              color: "var(--text-muted)",
            }}
          >
            {t.rich("apiUsedFor", {
              chat: (chunks) => <Typography.Text code>{chunks}</Typography.Text>,
              skills: (chunks) => <Typography.Text code>{chunks}</Typography.Text>,
            })}
          </Typography.Text>
        </fieldset>

        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
            margin: 0,
          }}
        >
          <legend
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              padding: "0 4px",
            }}
          >
            {t("accessToken")}
          </legend>
          <Input.Password
            value={activeEnvConfig.accessToken}
            onChange={(e) => handleTokenChange(e.target.value)}
            placeholder={t("pasteToken")}
            aria-label={t("accessToken")}
            suffix={
              <Tooltip title={t("clearToken")}>
                <DeleteOutlined
                  onClick={handleClearToken}
                  style={{ color: "var(--text-muted)", cursor: "pointer" }}
                  aria-label={t("clearToken")}
                />
              </Tooltip>
            }
          />
          <Typography.Text
            style={{
              fontSize: 12,
              display: "block",
              marginTop: 6,
              color: "var(--text-muted)",
            }}
          >
            {t.rich("sentAs", {
              header: () => (
                <Typography.Text code>
                  {"Authorization: Bearer <token>"}
                </Typography.Text>
              ),
            })}
          </Typography.Text>
        </fieldset>

        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
            margin: 0,
          }}
        >
          <legend
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              padding: "0 4px",
            }}
          >
            {t("aiServices")}
          </legend>
          <Tabs
            defaultActiveKey={getAIServiceProviders()[0]}
            type="card"
            size="small"
            items={aiServiceTabs}
            destroyOnHidden={false}
          />
        </fieldset>

        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: 16,
            margin: 0,
          }}
        >
          <legend
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-primary)",
              padding: "0 4px",
            }}
          >
            <DatabaseOutlined style={{ marginRight: 6 }} />
            {t("storageTitle")}
          </legend>
          <Flex vertical gap={8}>
            <Typography.Text style={{ fontSize: 13 }}>
              {t("sessions", { count: sessionCount })}
            </Typography.Text>
            {storageInfo ? (
              <>
                <Progress
                  percent={storagePercent}
                  size="small"
                  strokeColor="var(--accent)"
                  railColor="var(--border)"
                  showInfo={false}
                />
                <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {t("storageUsed", {
                    used: formatBytes(storageInfo.usage),
                    quota: formatBytes(storageInfo.quota),
                  })}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {t("storageUnavailable")}
              </Typography.Text>
            )}
          </Flex>
        </fieldset>

        <Typography.Text
          style={{
            fontSize: 12,
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          {t("version", { version: APP_VERSION })}
        </Typography.Text>
      </Flex>
    </Modal>
  );
}
