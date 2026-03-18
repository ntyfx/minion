"use client";

import { useState, useEffect } from "react";
import { Input, Button, Flex, Typography, Alert, Modal, Tooltip } from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { AppSettings } from "@/types/chat";
import { preferredDefaultBaseUrl } from "@/lib/settings";

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
    setNotice({ text: "Settings saved.", type: "success" });
  };

  const handleLoadDefaults = () => {
    const defaultUrl = preferredDefaultBaseUrl();
    setBaseUrl(defaultUrl);
    onSave({ baseUrl: defaultUrl, accessToken });
    setNotice({ text: "Base URL reset to default.", type: "info" });
  };

  const handleClearToken = () => {
    setAccessToken("");
    onSave({ baseUrl, accessToken: "" });
    setNotice({ text: "Access token cleared.", type: "info" });
  };

  return (
    <Modal
      title="Settings"
      open={open}
      onCancel={onToggle}
      onOk={handleSave}
      okText="Save"
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
      <Alert
        title="Point the base URL to your running minion server."
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 20 }}
      />

      <Flex vertical gap={20}>
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
            API Base URL
          </legend>
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:8080"
            aria-label="API Base URL"
            suffix={
              <Tooltip title="Reset to default">
                <UndoOutlined
                  onClick={handleLoadDefaults}
                  style={{ color: "var(--text-muted)", cursor: "pointer" }}
                  aria-label="Reset URL"
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
            Used for <Typography.Text code>/api/v1/chat</Typography.Text> and{" "}
            <Typography.Text code>/api/v1/skills</Typography.Text>.
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
            Access Token
          </legend>
          <Input.Password
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="Paste Bearer token"
            aria-label="Access token"
            addonAfter={
              <Tooltip title="Clear token">
                <DeleteOutlined
                  onClick={handleClearToken}
                  style={{ color: "var(--text-muted)", cursor: "pointer" }}
                  aria-label="Clear Token"
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
            Sent as{" "}
            <Typography.Text code>
              Authorization: Bearer &lt;token&gt;
            </Typography.Text>
            .
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
          Minion Chat v{APP_VERSION}
        </Typography.Text>
      </Flex>
    </Modal>
  );
}
