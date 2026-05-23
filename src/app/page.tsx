"use client";

import { useState, useEffect, useMemo } from "react";
import { useMemoizedFn } from "ahooks";
import { Layout, Modal, Input, Space, Spin } from "antd";
import { CHAT_ICON_KEYS, getChatIcon } from "@/lib/chat-icons";
import { useTranslations } from "next-intl";
import Sidebar from "@/components/sidebar";
import { BrandLogo, BrandMark } from "@/components/brand-logo";
import ChatPanel from "@/components/chat-panel";
import ActivityFeed from "@/components/activity-feed";
import SettingsPanel from "@/components/settings-panel";
import TemplatePanel from "@/components/template-panel";
import BookmarkPanel from "@/components/bookmark-panel";
import Dashboard from "@/components/dashboard";
import SequencePanel from "@/components/sequence-panel";
import { AppHeader } from "@/components/app-header";
import {
  ChatErrorBoundary,
  SidebarErrorBoundary,
  DashboardErrorBoundary,
} from "@/components/error-boundary-wrapper";
import { downloadShareFile, readShareFile, shareableToSession } from "@/lib/sharing";
import { createSession as createNewSession } from "@/lib/sessions";
import { saveBookmark, createBookmarkId, loadBookmarks } from "@/lib/bookmark-db";
import {
  loadSettings,
  saveSettings as persistSettings,
  getActiveEnvSettings,
} from "@/lib/settings";
import { getCurrentEnv, isSessionEnvMismatch } from "@/lib/env-routing";
import { useTheme } from "@/lib/theme";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { useStreaming } from "@/hooks/use-streaming";
import { useRenameModal } from "@/hooks/use-rename-modal";
import { useTagModal } from "@/hooks/use-tag-modal";
import { useUpdateNotification } from "@/hooks/use-update-notification";
import { message } from "antd";
import type { AppSettings } from "@/types/chat";

const { Sider } = Layout;

export default function Home() {
  const { colorScheme } = useTheme();
  const t = useTranslations("page");
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const activeEnvSettings = useMemo(
    () => getActiveEnvSettings(settings),
    [settings],
  );
  const currentEnv = useMemo(() => getCurrentEnv(settings), [settings]);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [seenEventCount, setSeenEventCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [sequencesOpen, setSequencesOpen] = useState(false);
  const [bookmarkedMessageIds, setBookmarkedMessageIds] = useState<Set<string>>(new Set());

  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    loadBookmarks()
      .then((bookmarks) => {
        const ids = new Set(bookmarks.map((b) => b.messageId));
        setBookmarkedMessageIds(ids);
      })
      .catch(() => {
        setBookmarkedMessageIds(new Set());
      });
  }, []);
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
    handleCreateSession: baseCreateSession,
    handleSelectSession: baseSelectSession,
    handleDeleteSession,
  } = useChatSessions(currentEnv);

  const handleCreateSession = useMemoizedFn(() => baseCreateSession(currentEnv));

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
    settings: activeEnvSettings,
    sessionsRef,
    setSessions,
    setActiveSessionId,
    updateSession,
    onMissingToken: () => {
      messageApi.warning(t("missingToken"));
      setSettingsOpen(true);
    },
    onStreamComplete: () => {
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

  const {
    tagModalOpen,
    tagInput,
    setTagInput,
    handleTagSession,
    handleTagConfirm,
    handleTagCancel,
  } = useTagModal({ sessions, updateSession });

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

  const handleSwitchEnv = useMemoizedFn((env: AppSettings["activeEnv"]) => {
    const next = { ...settings, activeEnv: env };
    setSettings(next);
    persistSettings(next);
  });

  const handlePinSession = useMemoizedFn((id: string) => {
    updateSession(id, (s) => ({ ...s, pinned: !s.pinned }));
  });

  const handleArchiveSession = useMemoizedFn((id: string) => {
    updateSession(id, (s) => ({ ...s, archived: !s.archived }));
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
    const bookmarkId = createBookmarkId();
    saveBookmark({
      id: bookmarkId,
      content,
      role: "assistant",
      tags: session.tags ?? [],
      sessionId: session.id,
      sessionLabel: session.label,
      messageId,
      createdAt: Date.now(),
    });
    setBookmarkedMessageIds((prev) => new Set([...prev, messageId]));
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

  const envMismatch = isSessionEnvMismatch(activeSession, currentEnv);

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "100dvh", background: "var(--bg-base)" }}>
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

      <SidebarErrorBoundary>
        <Sider
          width={260}
          collapsedWidth={48}
          collapsible
          collapsed={siderCollapsed}
          trigger={null}
          style={{
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border)",
            overflow: "hidden",
          }}
          theme={colorScheme}
        >
          <div className="flex flex-col h-full">
            <div
              style={{
                height: 45,
                display: "flex",
                alignItems: "center",
                justifyContent: siderCollapsed ? "center" : "flex-start",
                padding: siderCollapsed ? "0" : "0 16px",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
                transition: "padding var(--transition-slow)",
              }}
            >
              {siderCollapsed ? (
                <BrandMark size={22} />
              ) : (
                <div className="sidebar-brand">
                  <BrandLogo size={26} />
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
            <div className="sidebar-footer">
              {t("subtitle")}
            </div>
          )}
        </div>
        </Sider>
      </SidebarErrorBoundary>

      <Layout style={{ background: "var(--bg-base)" }}>
        <AppHeader
          siderCollapsed={siderCollapsed}
          setSiderCollapsed={setSiderCollapsed}
          isStreaming={isStreaming}
          settings={settings}
          activeEnvSettings={activeEnvSettings}
          activeSession={activeSession}
          sessions={sessions}
          unseenEventCount={unseenEventCount}
          onImportSession={handleImportSession}
          onShareSession={handleShareSession}
          onToggleActivity={handleToggleActivity}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenTemplates={() => setTemplatesOpen(true)}
          onOpenBookmarks={() => setBookmarksOpen(true)}
          onOpenSequences={() => setSequencesOpen(true)}
          onSwitchEnv={handleSwitchEnv}
        />

        <main style={{ flex: 1, overflow: "hidden" }}>
          {!activeSession ? (
            <DashboardErrorBoundary>
              <Dashboard
                sessions={sessions}
                onSelectSession={handleSelectSession}
                onQuickAction={(text) => {
                  handleCreateSession();
                  setInputValue(text);
                }}
              />
            </DashboardErrorBoundary>
          ) : (
            <ChatErrorBoundary>
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
                bookmarkedMessageIds={bookmarkedMessageIds}
                disabled={envMismatch}
                disabledReason={
                  envMismatch
                    ? t("envMismatch", { sessionEnv: activeSession?.env ?? "", currentEnv })
                    : undefined
                }
              />
            </ChatErrorBoundary>
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
        isStreaming={isStreaming}
        onSendMessage={handleSend}
        onStopStreaming={handleStop}
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
        onCancel={handleTagCancel}
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
                  className={`flex items-center justify-center w-9 h-9 rounded-lg cursor-pointer text-base transition-colors ${
                    iconValue === key
                      ? "border-2 border-[var(--accent)] text-[var(--accent)]"
                      : "border border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                  style={{
                    background: iconValue === key
                      ? "color-mix(in srgb, var(--accent) 12%, transparent)"
                      : "transparent",
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
