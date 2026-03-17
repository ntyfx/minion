"use client";

import { useState, useCallback } from "react";
import { Layout, Badge, Modal, Input, Flex, Tooltip, message } from "antd";
import {
  SafetyCertificateOutlined,
  LinkOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import Sidebar from "@/components/sidebar";
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
import type { AppSettings } from "@/types/chat";

const { Sider } = Layout;

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [seenEventCount, setSeenEventCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [messageApi, contextHolder] = message.useMessage();

  const {
    sessions,
    setSessions,
    sessionsRef,
    activeSessionId,
    setActiveSessionId,
    activeSession,
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
      messageApi.warning("Please set an access token in Settings first.");
      setSettingsOpen(true);
    },
  });

  const {
    renameModalOpen,
    renameValue,
    setRenameValue,
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
    : "not set";

  return (
    <Layout style={{ height: "100dvh", background: "var(--bg-base)" }}>
      {contextHolder}

      <Sider
        width={280}
        collapsible
        collapsed={siderCollapsed}
        onCollapse={setSiderCollapsed}
        style={{
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        theme={theme}
      >
        {!siderCollapsed && (
          <div
            style={{
              padding: "16px 16px 12px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                margin: 0,
                fontWeight: 600,
                fontSize: 15,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  flexShrink: 0,
                }}
              />
              Minion Chat
            </div>
            <div
              style={{
                fontSize: 12,
                marginTop: 2,
                color: "var(--text-muted)",
              }}
            >
              Game Operations AI Agent
            </div>
          </div>
        )}
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
      </Sider>

      <Layout style={{ background: "var(--bg-base)" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
            background: "var(--bg-surface)",
            height: 44,
            gap: 8,
          }}
        >
          <Flex gap={8} wrap align="center" style={{ minWidth: 0 }}>
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
              {isStreaming ? "Streaming" : "Idle"}
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
            <Tooltip title={theme === "dark" ? "Light mode" : "Dark mode"}>
              <button
                onClick={toggleTheme}
                className="icon-button"
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>
            <Tooltip title="Settings">
              <button
                onClick={() => setSettingsOpen(true)}
                className="icon-button"
                aria-label="Open settings"
              >
                <SettingOutlined />
              </button>
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
      />

      <Modal
        title="Rename Conversation"
        open={renameModalOpen}
        onOk={handleRenameConfirm}
        onCancel={handleRenameCancel}
        okText="Rename"
        destroyOnHidden
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={handleRenameConfirm}
          placeholder="Enter new name"
          autoFocus
        />
      </Modal>
    </Layout>
  );
}
