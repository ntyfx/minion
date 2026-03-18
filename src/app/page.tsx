"use client";

import { useState, useCallback } from "react";
import { Layout, Badge, Modal, Input, Flex, Tooltip, message, Space, Spin } from "antd";
import {
  SafetyCertificateOutlined,
  LinkOutlined,
  SettingOutlined,
  GithubOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { CHAT_ICON_KEYS, getChatIcon } from "@/lib/chat-icons";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/sidebar";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import ChatPanel from "@/components/chat-panel";
import ActivityFeed, { ActivityToggle } from "@/components/activity-feed";
import { ToolsToggle } from "@/components/tools-status";
import SettingsPanel from "@/components/settings-panel";
import {
  loadSettings,
  saveSettings as persistSettings,
} from "@/lib/settings";
import { useTheme } from "@/lib/theme";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useStreaming } from "@/hooks/use-streaming";
import { useRenameModal } from "@/hooks/use-rename-modal";
import { useUpdateNotification } from "@/hooks/use-update-notification";
import type { AppSettings } from "@/types/chat";

const { Sider } = Layout;

export default function Home() {
  const { colorScheme } = useTheme();
  const t = useTranslations("page");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [seenEventCount, setSeenEventCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();
  const updateNotificationHolder = useUpdateNotification();

  const {
    sessions,
    setSessions,
    sessionsRef,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    loading: sessionsLoading,
    updateSession,
    handleCreateSession,
    handleSelectSession: baseSelectSession,
    handleDeleteSession,
  } = useChatSessions();

  const {
    isStreaming,
    streamingContent,
    reasoningContent,
    inputValue,
    setInputValue,
    handleSend,
    handleStop,
  } = useStreaming({
    activeSessionId,
    settings,
    sessionsRef,
    setSessions,
    setActiveSessionId,
    updateSession,
    onMissingToken: () => {
      messageApi.warning(t("missingToken"));
      setSettingsOpen(true);
    },
  });

  const {
    renameModalOpen,
    renameValue,
    setRenameValue,
    iconValue,
    setIconValue,
    handleRenameSession,
    handleRenameConfirm,
    handleRenameCancel,
  } = useRenameModal({ sessions, updateSession });

  const handleSelectSession = useCallback(
    (id: string) => {
      baseSelectSession(id);
      setInputValue("");
      setSeenEventCount(0);
      setActivityOpen(false);
    },
    [baseSelectSession, setInputValue],
  );

  const handleSaveSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    persistSettings(next);
  }, []);

  const handleClearActivity = useCallback(() => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, (s) => ({ ...s, activity: [] }));
    setSeenEventCount(0);
  }, [activeSessionId, updateSession]);

  const handleToggleActivity = useCallback(() => {
    setActivityOpen((prev) => {
      if (!prev) {
        setSeenEventCount(activeSession?.activity.length ?? 0);
      }
      return !prev;
    });
  }, [activeSession?.activity.length]);

  const unseenEventCount = Math.max(
    0,
    (activeSession?.activity.length ?? 0) - seenEventCount,
  );

  const tokenPreview = settings.accessToken
    ? `${settings.accessToken.slice(0, 6)}…${settings.accessToken.slice(-4)}`
    : t("tokenNotSet");

  if (sessionsLoading) {
    return (
      <div style={{ height: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-base)" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout style={{ height: "100dvh", background: "var(--bg-base)" }}>
      {contextHolder}
      {updateNotificationHolder}

      <svg width={0} height={0} aria-hidden>
        <defs>
          <linearGradient id="brand-svg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--brand-g1)" }} />
            <stop offset="50%" style={{ stopColor: "var(--brand-g2)" }} />
            <stop offset="100%" style={{ stopColor: "var(--brand-g3)" }} />
          </linearGradient>
        </defs>
      </svg>

      <Sider
        width={260}
        collapsedWidth={48}
        collapsible
        collapsed={siderCollapsed}
        trigger={null}
        style={{
          background: "var(--bg-surface)",
          boxShadow: "1px 0 0 var(--border)",
          overflow: "hidden",
        }}
        theme={colorScheme}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              height: 45,
              display: "flex",
              alignItems: "center",
              justifyContent: siderCollapsed ? "center" : "flex-start",
              padding: siderCollapsed ? "0" : "0 16px",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            {siderCollapsed ? (
              <BrandMark size={24} />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                }}
              >
                <BrandLogo size={28} />
                <span className="brand-gradient-text">Minion Chat</span>
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Sidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              collapsed={siderCollapsed}
              onSelectSession={handleSelectSession}
              onCreateSession={handleCreateSession}
              onDeleteSession={handleDeleteSession}
              onRenameSession={handleRenameSession}
            />
          </div>
          {!siderCollapsed && (
            <div
              style={{
              padding: "8px 16px",
              fontSize: 11,
              color: "var(--text-muted)",
              flexShrink: 0,
              textAlign: "center",
              }}
            >
              {t("subtitle")}
            </div>
          )}
        </div>
      </Sider>

      <Layout style={{ background: "var(--bg-base)" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px 0 8px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            background: "var(--bg-surface)",
            height: 45,
            gap: 8,
          }}
        >
          <Flex gap={8} wrap align="center" style={{ minWidth: 0 }}>
            <Tooltip title={siderCollapsed ? t("expandSidebar") : t("collapseSidebar")}>
              <button
                className="icon-button icon-button-muted"
                onClick={() => setSiderCollapsed((c) => !c)}
                aria-label={siderCollapsed ? t("expandSidebar") : t("collapseSidebar")}
              >
                {siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </Tooltip>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--text-secondary)",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
            >
              <Badge
                status={isStreaming ? "processing" : "default"}
                style={{ marginRight: 0 }}
              />
              {isStreaming ? t("streaming") : t("idle")}
            </span>
            <span
              style={{
                width: 1,
                height: 14,
                background: "var(--border)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <LinkOutlined style={{ fontSize: 11, marginRight: 4 }} />
              {settings.baseUrl.replace(/^https?:\/\//, "")}
            </span>
            <span
              style={{
                width: 1,
                height: 14,
                background: "var(--border)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
            >
              <SafetyCertificateOutlined style={{ fontSize: 11, marginRight: 4 }} />
              {tokenPreview}
            </span>
          </Flex>

          <Flex gap={4} align="center">
            <ToolsToggle
              baseUrl={settings.baseUrl}
              accessToken={settings.accessToken}
            />
            <ActivityToggle
              count={unseenEventCount}
              onClick={handleToggleActivity}
            />
            <Tooltip title={t("settings")}>
              <button
                onClick={() => setSettingsOpen(true)}
                className="icon-button"
                aria-label={t("openSettings")}
              >
                <SettingOutlined />
              </button>
            </Tooltip>
            <Tooltip title="GitHub">
              <a
                href="https://github.com/ntyfx/minion"
                target="_blank"
                rel="noopener noreferrer"
                className="icon-button icon-button-gradient"
                aria-label="GitHub"
              >
                <GithubOutlined />
              </a>
            </Tooltip>
          </Flex>
        </header>

        <main style={{ flex: 1, overflow: "hidden" }}>
          <ChatPanel
            session={activeSession}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            reasoningContent={reasoningContent}
            inputValue={inputValue}
            onInputChange={setInputValue}
            onSend={handleSend}
            onStop={handleStop}
          />
        </main>
      </Layout>

      <ActivityFeed
        events={activeSession?.activity ?? []}
        onClear={handleClearActivity}
        open={activityOpen}
        onToggle={handleToggleActivity}
      />

      <SettingsPanel
        settings={settings}
        onSave={handleSaveSettings}
        open={settingsOpen}
        onToggle={() => setSettingsOpen(false)}
        sessionCount={sessions.length}
      />

      <Modal
        title={t("renameConversation")}
        open={renameModalOpen}
        onOk={handleRenameConfirm}
        onCancel={handleRenameCancel}
        okText={t("rename")}
        destroyOnHidden
      >
        <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              {t("chooseIcon")}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(10, 1fr)",
                gap: 4,
              }}
            >
              {CHAT_ICON_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIconValue(key)}
                  aria-label={key}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    border: iconValue === key
                      ? "2px solid var(--accent)"
                      : "1px solid var(--border)",
                    background: iconValue === key
                      ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                      : "transparent",
                    cursor: "pointer",
                    fontSize: 16,
                    color: iconValue === key ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {getChatIcon(key)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
              {t("enterNewName")}
            </div>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onPressEnter={handleRenameConfirm}
              placeholder={t("enterNewName")}
              autoFocus
            />
          </div>
        </Space>
      </Modal>
    </Layout>
  );
}
