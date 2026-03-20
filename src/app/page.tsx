"use client";

import { useState } from "react";
import { useMemoizedFn } from "ahooks";
import { Layout, Badge, Modal, Input, Flex, Tooltip, message, Space, Spin } from "antd";
import {
  SafetyCertificateOutlined,
  LinkOutlined,
  SettingOutlined,
  GithubOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ShareAltOutlined,
  ImportOutlined,
} from "@ant-design/icons";
import { CHAT_ICON_KEYS, getChatIcon } from "@/lib/chat-icons";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/sidebar";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import ChatPanel from "@/components/chat-panel";
import ActivityFeed, { ActivityToggle } from "@/components/activity-feed";
import { ToolsToggle } from "@/components/tools-status";
import { TokenReportToggle } from "@/components/token-report";
import SettingsPanel from "@/components/settings-panel";
import TemplatePanel, { TemplateToggle } from "@/components/template-panel";
import BookmarkPanel, { BookmarkToggle } from "@/components/bookmark-panel";
import { ExportMenu } from "@/components/export-menu";
import Dashboard from "@/components/dashboard";
import SequencePanel, { SequenceToggle } from "@/components/sequence-panel";
import { downloadShareFile, readShareFile, shareableToSession } from "@/lib/sharing";
import { createSession as createNewSession } from "@/lib/sessions";
import { saveBookmark, createBookmarkId } from "@/lib/bookmark-db";
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
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [sequencesOpen, setSequencesOpen] = useState(false);

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
    handleResend,
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

  const handleSelectSession = useMemoizedFn((id: string) => {
    baseSelectSession(id);
    setInputValue("");
    setSeenEventCount(0);
    setActivityOpen(false);
  });

  const handleSaveSettings = useMemoizedFn((next: AppSettings) => {
    setSettings(next);
    persistSettings(next);
  });

  const handlePinSession = useMemoizedFn((id: string) => {
    updateSession(id, (s) => ({ ...s, pinned: !s.pinned }));
  });

  const handleArchiveSession = useMemoizedFn((id: string) => {
    updateSession(id, (s) => ({ ...s, archived: !s.archived }));
  });

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagSessionId, setTagSessionId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const handleTagSession = useMemoizedFn((id: string) => {
    setTagSessionId(id);
    const s = sessions.find((s) => s.id === id);
    setTagInput((s?.tags ?? []).join(", "));
    setTagModalOpen(true);
  });

  const handleTagConfirm = useMemoizedFn(() => {
    if (!tagSessionId) return;
    const tags = tagInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    updateSession(tagSessionId, (s) => ({ ...s, tags }));
    setTagModalOpen(false);
    setTagSessionId(null);
  });

  const handleShareSession = useMemoizedFn(() => {
    if (activeSession) {
      downloadShareFile(activeSession);
    }
  });

  const handleImportSession = useMemoizedFn(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".minion,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const shared = await readShareFile(file);
        const newSess = shareableToSession(shared, createNewSession().id);
        setSessions((prev) => [...prev, newSess]);
        setActiveSessionId(newSess.id);
        messageApi.success(t("importSuccess"));
      } catch {
        messageApi.error(t("importFailed"));
      }
    };
    input.click();
  });

  const handleBookmark = useMemoizedFn((content: string, messageId: string) => {
    const session = activeSession;
    if (!session) return;
    saveBookmark({
      id: createBookmarkId(),
      content,
      role: "assistant",
      tags: session.tags ?? [],
      sessionId: session.id,
      sessionLabel: session.label,
      messageId,
      createdAt: Date.now(),
    });
  });

  const handleClearActivity = useMemoizedFn(() => {
    if (!activeSessionId) return;
    updateSession(activeSessionId, (s) => ({ ...s, activity: [] }));
    setSeenEventCount(0);
  });

  const handleToggleActivity = useMemoizedFn(() => {
    setActivityOpen((prev) => {
      if (!prev) {
        setSeenEventCount(activeSession?.activity.length ?? 0);
      }
      return !prev;
    });
  });

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
              onPinSession={handlePinSession}
              onArchiveSession={handleArchiveSession}
              onTagSession={handleTagSession}
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
            <Tooltip title={t("importSession")}>
              <button className="icon-button" onClick={handleImportSession} aria-label={t("importSession")}>
                <ImportOutlined />
              </button>
            </Tooltip>
            <Tooltip title={t("shareSession")}>
              <button
                className="icon-button"
                onClick={handleShareSession}
                aria-label={t("shareSession")}
                disabled={!activeSession || activeSession.messages.length === 0}
                style={{ opacity: activeSession?.messages.length ? 1 : 0.4 }}
              >
                <ShareAltOutlined />
              </button>
            </Tooltip>
            <SequenceToggle onClick={() => setSequencesOpen(true)} />
            <ExportMenu session={activeSession} />
            <BookmarkToggle onClick={() => setBookmarksOpen(true)} />
            <TemplateToggle onClick={() => setTemplatesOpen(true)} />
            <TokenReportToggle sessions={sessions} />
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
                data-testid="settings-button"
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
          {!activeSession ? (
            <Dashboard
              sessions={sessions}
              onSelectSession={handleSelectSession}
              onQuickAction={(text) => {
                handleCreateSession();
                setInputValue(text);
              }}
            />
          ) : (
            <ChatPanel
              session={activeSession}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              reasoningContent={reasoningContent}
              inputValue={inputValue}
              onInputChange={setInputValue}
              onSend={handleSend}
              onResend={handleResend}
              onStop={handleStop}
              onBookmark={handleBookmark}
            />
          )}
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

      <TemplatePanel
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onUse={(text) => {
          setInputValue(text);
        }}
      />

      <SequencePanel
        open={sequencesOpen}
        onClose={() => setSequencesOpen(false)}
        onRun={(messages) => {
          if (messages.length > 0) {
            handleSend(messages[0]);
          }
        }}
      />

      <BookmarkPanel
        open={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        onInsert={(text) => {
          setInputValue((prev) => prev + (prev ? "\n" : "") + text);
        }}
      />

      <Modal
        title={t("editTags")}
        open={tagModalOpen}
        onOk={handleTagConfirm}
        onCancel={() => setTagModalOpen(false)}
        okText={t("rename")}
        destroyOnHidden
      >
        <div style={{ marginBottom: 8, fontSize: 13, color: "var(--text-secondary)" }}>
          {t("tagsHint")}
        </div>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onPressEnter={handleTagConfirm}
          placeholder={t("tagsPlaceholder")}
          autoFocus
        />
      </Modal>

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
