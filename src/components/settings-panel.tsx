"use client";

import { useState, useEffect } from "react";
import { Input, Flex, Typography, Alert, Modal, Tooltip, Select } from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { AppSettings } from "@/types/chat";
import { preferredDefaultBaseUrl } from "@/lib/settings";
import { useAppLocale, LOCALE_LIST, type LocaleId } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { THEME_LIST, type ThemeId } from "@/lib/themes";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "unknown";

interface SettingsPanelProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  open: boolean;
  onToggle: () => void;
}

export default function SettingsPanel({
  settings,
  onSave,
  open,
  onToggle,
}: SettingsPanelProps) {
  const t = useTranslations("settings");
  const tTheme = useTranslations("theme");
  const { locale, setLocale } = useAppLocale();
  const { themeId, setTheme } = useTheme();
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [accessToken, setAccessToken] = useState(settings.accessToken);
  const [notice, setNotice] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    setBaseUrl(settings.baseUrl);
    setAccessToken(settings.accessToken);
  }, [settings]);

  const handleSave = () => {
    onSave({ baseUrl, accessToken });
    setNotice({ text: t("saved"), type: "success" });
  };

  const handleLoadDefaults = () => {
    const defaultUrl = preferredDefaultBaseUrl();
    setBaseUrl(defaultUrl);
    onSave({ baseUrl: defaultUrl, accessToken });
    setNotice({ text: t("urlReset"), type: "info" });
  };

  const handleClearToken = () => {
    setAccessToken("");
    onSave({ baseUrl, accessToken: "" });
    setNotice({ text: t("tokenCleared"), type: "info" });
  };

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
    >
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
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
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
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
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

        {notice && (
          <Alert
            title={notice.text}
            type={notice.type}
            showIcon
            closable
            onClose={() => setNotice(null)}
          />
        )}

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
