"use client";

import { memo, useMemo, useCallback } from "react";
import { Typography, Flex, Tag, Tooltip } from "antd";
import {
  MessageOutlined,
  FieldTimeOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { Session } from "@/types/chat";
import { BUILTIN_TEMPLATES } from "@/lib/sharing";
import { BrandLogo } from "@/components/brand-logo";
import { getChatIcon } from "@/lib/chat-icons";
import { formatTimeAgo } from "@/lib/utils";
import { DEFAULT_QUICK_ACTIONS } from "@/lib/quick-actions";

interface DashboardProps {
  sessions: Session[];
  onSelectSession: (id: string) => void;
  onQuickAction: (text: string) => void;
}

export default memo(function Dashboard({
  sessions,
  onSelectSession,
  onQuickAction,
}: DashboardProps) {
  const t = useTranslations("dashboard");

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .filter((s) => !s.archived && s.messages.length > 0)
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 6),
    [sessions],
  );

  const totalTokens = useMemo(() => {
    let total = 0;
    for (const s of sessions) {
      for (const evt of s.activity) {
        if (evt.type === "token_usage" && evt.payload && typeof evt.payload === "object") {
          const p = evt.payload as Record<string, unknown>;
          if (typeof p.total_tokens === "number") total += p.total_tokens;
        }
      }
    }
    return total;
  }, [sessions]);

  const sessionSummary = useCallback((s: Session): string => {
    const lastAi = [...s.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAi) return "";
    return lastAi.content.slice(0, 80) + (lastAi.content.length > 80 ? "…" : "");
  }, []);

  return (
    <div className="dashboard-root">
      <div className="dashboard-header">
        <BrandLogo size={48} />
        <Typography.Title level={3} style={{ margin: "12px 0 4px", color: "var(--text-primary)" }}>
          <span className="brand-gradient-text">{t("title")}</span>
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 14 }}>
          {t("subtitle")}
        </Typography.Text>
      </div>

      <div className="dashboard-stats">
        <div className="dashboard-stat">
          <MessageOutlined style={{ fontSize: 18, color: "var(--accent)" }} />
          <div>
            <div className="dashboard-stat-value">{sessions.length}</div>
            <div className="dashboard-stat-label">{t("totalSessions")}</div>
          </div>
        </div>
        <div className="dashboard-stat">
          <FieldTimeOutlined style={{ fontSize: 18, color: "var(--info)" }} />
          <div>
            <div className="dashboard-stat-value">{totalTokens.toLocaleString()}</div>
            <div className="dashboard-stat-label">{t("totalTokens")}</div>
          </div>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="dashboard-section">
          <Typography.Text strong style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
            {t("recentSessions")}
          </Typography.Text>
          <div className="dashboard-recent-grid">
            {recentSessions.map((s) => (
              <button
                key={s.id}
                className="dashboard-recent-card"
                onClick={() => onSelectSession(s.id)}
              >
                <Flex align="center" gap={8}>
                  <span style={{ fontSize: 16 }}>{getChatIcon(s.icon)}</span>
                  <Typography.Text strong ellipsis style={{ fontSize: 13, flex: 1 }}>
                    {s.label}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}
                  >
                    {formatTimeAgo(s.updatedAt, "now")}
                  </Typography.Text>
                </Flex>
                <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: "block" }} ellipsis>
                  {sessionSummary(s)}
                </Typography.Text>
                {(s.tags ?? []).length > 0 && (
                  <Flex gap={4} style={{ marginTop: 4 }}>
                    {(s.tags ?? []).slice(0, 3).map((tag) => (
                      <Tag key={tag} style={{ fontSize: 10, margin: 0, padding: "0 4px" }}>{tag}</Tag>
                    ))}
                  </Flex>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="dashboard-section">
        <Typography.Text strong style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
          {t("quickActions")}
        </Typography.Text>
        <Flex gap={8} wrap>
          {DEFAULT_QUICK_ACTIONS.map((action) => (
            <Tooltip key={action.key} title={t(action.labelKey)}>
              <button
                className="dashboard-quick-btn"
                onClick={() => onQuickAction(action.text)}
              >
                <action.icon />
                <span>{t(action.labelKey)}</span>
              </button>
            </Tooltip>
          ))}
        </Flex>
      </div>

      <div className="dashboard-section">
        <Typography.Text strong style={{ fontSize: 13, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
          <BulbOutlined style={{ marginRight: 4 }} />
          {t("builtinTemplates")}
        </Typography.Text>
        <Flex gap={8} wrap>
          {BUILTIN_TEMPLATES.slice(0, 4).map((tmpl) => (
            <button
              key={tmpl.name}
              className="dashboard-template-btn"
              onClick={() => onQuickAction(tmpl.content)}
            >
              <Typography.Text strong style={{ fontSize: 12 }}>{tmpl.name}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>{tmpl.content}</Typography.Text>
            </button>
          ))}
        </Flex>
      </div>
    </div>
  );
});
