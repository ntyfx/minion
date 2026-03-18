"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Button,
  Flex,
  Typography,
  Alert,
  Drawer,
} from "antd";
import {
  SaveOutlined,
  UndoOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { AppSettings } from "@/types/chat";
import { preferredDefaultBaseUrl } from "@/lib/settings";

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
    <Drawer
      title={
        <div>
          <Typography.Text
            strong
            style={{ fontSize: 14, color: "var(--text-primary)" }}
          >
            Settings
          </Typography.Text>
          <Typography.Text
            style={{
              display: "block",
              fontSize: 12,
              marginTop: 2,
              color: "var(--text-muted)",
            }}
          >
            Stored in localStorage
          </Typography.Text>
        </div>
      }
      placement="right"
      open={open}
      onClose={onToggle}
      styles={{
        wrapper: { width: 400 },
        header: { padding: "14px 20px" },
        body: { padding: "20px" },
      }}
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

        <Flex gap={8} wrap>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Save
          </Button>
          <Button icon={<UndoOutlined />} onClick={handleLoadDefaults}>
            Reset URL
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearToken}
          >
            Clear Token
          </Button>
        </Flex>

        {notice && (
          <Alert
            title={notice.text}
            type={notice.type}
            showIcon
            closable
            onClose={() => setNotice(null)}
          />
        )}
      </Flex>
    </Drawer>
  );
}
