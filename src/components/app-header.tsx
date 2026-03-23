"use client";

import { useMemoizedFn } from "ahooks";
import { Badge, Flex, Tooltip } from "antd";
import {
  SafetyCertificateOutlined,
  LinkOutlined,
  GithubOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ImportOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { ShareDropdown } from "@/components/share-dropdown";
import { ActivityToggle } from "@/components/activity-feed";
import { ToolsToggle } from "@/components/tools-status";
import { TokenReportToggle } from "@/components/token-report";
import { TokenReportErrorBoundary } from "@/components/error-boundary-wrapper";
import { TemplateToggle } from "@/components/template-panel";
import { BookmarkToggle } from "@/components/bookmark-panel";
import { SequenceToggle } from "@/components/sequence-panel";
import type { Session, AppSettings } from "@/types/chat";

interface AppHeaderProps {
  siderCollapsed: boolean;
  setSiderCollapsed: (collapsed: boolean) => void;
  isStreaming: boolean;
  settings: AppSettings;
  activeSession: Session | null;
  sessions: Session[];
  unseenEventCount: number;
  onImportSession: () => void;
  onShareSession: () => void;
  onToggleActivity: () => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onOpenBookmarks: () => void;
  onOpenSequences: () => void;
}

export function AppHeader({
  siderCollapsed,
  setSiderCollapsed,
  isStreaming,
  settings,
  activeSession,
  sessions,
  unseenEventCount,
  onImportSession,
  onShareSession,
  onToggleActivity,
  onOpenSettings,
  onOpenTemplates,
  onOpenBookmarks,
  onOpenSequences,
}: AppHeaderProps) {
  const t = useTranslations("page");

  const toggleSidebar = useMemoizedFn(() => {
    setSiderCollapsed(!siderCollapsed);
  });

  const tokenPreview = settings.accessToken
    ? `${settings.accessToken.slice(0, 6)}…${settings.accessToken.slice(-4)}`
    : t("tokenNotSet");

  return (
    <header className="app-header">
      <Flex gap={6} align="center" style={{ minWidth: 0 }}>
        <Tooltip title={siderCollapsed ? t("expandSidebar") : t("collapseSidebar")}>
          <button
            className="icon-button icon-button-muted"
            onClick={toggleSidebar}
            aria-label={siderCollapsed ? t("expandSidebar") : t("collapseSidebar")}
          >
            {siderCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </Tooltip>
        <span className="header-divider" />
        <span className="header-status-chip">
          <Badge
            status={isStreaming ? "processing" : "default"}
            style={{ marginRight: 0 }}
          />
          {isStreaming ? t("streaming") : t("idle")}
        </span>
        <span className="header-meta">
          <LinkOutlined style={{ fontSize: 10 }} />
          {settings.baseUrl.replace(/^https?:\/\//, "")}
        </span>
        <span className="header-meta">
          <SafetyCertificateOutlined style={{ fontSize: 10 }} />
          {tokenPreview}
        </span>
      </Flex>

      <Flex gap={2} align="center">
        <Tooltip title={t("importSession")}>
          <button className="icon-button" onClick={onImportSession} aria-label={t("importSession")}>
            <ImportOutlined />
          </button>
        </Tooltip>
        <ShareDropdown
          activeSession={activeSession}
          onShare={onShareSession}
          t={t}
        />
        <SequenceToggle onClick={onOpenSequences} />
        <BookmarkToggle onClick={onOpenBookmarks} />
        <TemplateToggle onClick={onOpenTemplates} />
        <TokenReportErrorBoundary>
          <TokenReportToggle sessions={sessions} />
        </TokenReportErrorBoundary>
        <ToolsToggle
          baseUrl={settings.baseUrl}
          accessToken={settings.accessToken}
        />
        <ActivityToggle
          count={unseenEventCount}
          onClick={onToggleActivity}
        />
        <span className="header-divider" />
        <Tooltip title={t("settings")}>
          <button
            onClick={onOpenSettings}
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
  );
}

export default AppHeader;
