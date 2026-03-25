"use client";

import { useMemo, memo, useState, useCallback } from "react";
import { Conversations } from "@ant-design/x";
import { Input, Tooltip, Tag, Flex } from "antd";
import { useTranslations } from "next-intl";
import { formatTimeAgo } from "@/lib/utils";
import { ENV_COLORS } from "@/lib/environment";
import type { EnvType } from "@/lib/environment";
import type { Session } from "@/types/chat";
import {
  DeleteOutlined,
  EditOutlined,
  PushpinOutlined,
  InboxOutlined,
  SearchOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { getChatIcon } from "@/lib/chat-icons";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  collapsed?: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string) => void;
  onPinSession?: (id: string) => void;
  onArchiveSession?: (id: string) => void;
  onTagSession?: (id: string) => void;
}

export default memo(function Sidebar({
  sessions,
  activeSessionId,
  collapsed,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onPinSession,
  onArchiveSession,
  onTagSession,
}: SidebarProps) {
  const t = useTranslations("sidebar");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filteredSessions = useMemo(() => {
    let list = sessions.filter((s) =>
      showArchived ? s.archived : !s.archived,
    );
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.label.toLowerCase().includes(q) ||
          (s.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
          s.messages.some((m) => m.content.toLowerCase().includes(q)),
      );
    }
    return list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [sessions, search, showArchived]);

  const items = useMemo(() => {
    const envLabel = (env: EnvType | undefined) =>
      env ? t(`env_${env}` as Parameters<typeof t>[0]) : "";

    const envDotStyle = (env: EnvType): React.CSSProperties => ({
      position: "absolute",
      top: -2,
      right: -4,
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: ENV_COLORS[env],
      border: "1.5px solid var(--bg-surface)",
    });

    const iconWithDot = (s: Session) => {
      const env = s.env;
      if (!env) return getChatIcon(s.icon);
      return (
        <span style={{ position: "relative", display: "inline-flex" }}>
          {getChatIcon(s.icon)}
          <span style={envDotStyle(env)} />
        </span>
      );
    };

    return filteredSessions.map((s) => {
      const label = envLabel(s.env);
      const collapsedTitle = label ? `${s.label}  [${label}]` : s.label;

      if (collapsed) {
        return {
          key: s.id,
          label: (
            <Tooltip title={collapsedTitle} placement="right">
              <span style={{ display: "flex", justifyContent: "center", fontSize: 16 }}>
                {s.pinned
                  ? <PushpinOutlined style={{ color: "var(--accent)" }} />
                  : iconWithDot(s)}
              </span>
            </Tooltip>
          ),
        };
      }

      return {
        key: s.id,
        label: (
          <Flex align="center" gap={4}>
            {s.pinned && (
              <PushpinOutlined style={{ fontSize: 10, color: "var(--accent)", flexShrink: 0 }} />
            )}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {s.label}
            </span>
          </Flex>
        ),
        icon: (
          <Tooltip title={label || undefined} placement="right">
            <span style={{ display: "inline-flex" }}>
              {iconWithDot(s)}
            </span>
          </Tooltip>
        ),
        description: (
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontVariantNumeric: "tabular-nums",
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            <span>
              {s.messages.length > 0
                ? `${s.messages.length} ${t("msg")} · ${formatTimeAgo(s.updatedAt, t("now"))}`
                : formatTimeAgo(s.updatedAt, t("now"))}
            </span>
            {(s.tags ?? []).map((tag) => (
              <Tag
                key={tag}
                style={{
                  margin: 0,
                  fontSize: 10,
                  lineHeight: "16px",
                  padding: "0 4px",
                  borderRadius: 4,
                }}
              >
                {tag}
              </Tag>
            ))}
          </span>
        ),
      };
    });
  }, [filteredSessions, collapsed, t]);

  const handleToggleArchived = useCallback(() => {
    setShowArchived((v) => !v);
  }, []);

  return (
    <nav
      aria-label={t("conversations")}
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      {!collapsed && (
        <div style={{ padding: "8px 8px 0", flexShrink: 0 }}>
          <Input
            size="small"
            prefix={<SearchOutlined style={{ color: "var(--text-muted)", fontSize: 12 }} />}
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ borderRadius: 8, fontSize: 12 }}
          />
          <Flex gap={4} style={{ marginTop: 6 }}>
            <button
              className={`sidebar-filter-btn${!showArchived ? " sidebar-filter-btn-active" : ""}`}
              onClick={() => setShowArchived(false)}
            >
              {t("active")}
            </button>
            <button
              className={`sidebar-filter-btn${showArchived ? " sidebar-filter-btn-active" : ""}`}
              onClick={handleToggleArchived}
            >
              <InboxOutlined style={{ fontSize: 11 }} /> {t("archived")}
            </button>
          </Flex>
        </div>
      )}
      <Conversations
        activeKey={activeSessionId ?? undefined}
        items={items}
        creation={{
          label: collapsed ? undefined : t("newChat"),
          onClick: onCreateSession,
          style: collapsed
            ? { width: 32, height: 32, borderRadius: "50%", padding: 0, justifyContent: "center", margin: "8px auto 12px" }
            : { marginBlock: "8px 12px", borderRadius: 9999 },
        }}
        menu={
          collapsed
            ? undefined
            : (conversation) => ({
                items: [
                  {
                    key: "rename",
                    label: t("menuRename"),
                    icon: <EditOutlined />,
                  },
                  {
                    key: "pin",
                    label: t("menuPin"),
                    icon: <PushpinOutlined />,
                  },
                  {
                    key: "tag",
                    label: t("menuTag"),
                    icon: <TagOutlined />,
                  },
                  {
                    key: "archive",
                    label: showArchived ? t("menuUnarchive") : t("menuArchive"),
                    icon: <InboxOutlined />,
                  },
                  {
                    key: "delete",
                    label: t("menuDelete"),
                    icon: <DeleteOutlined />,
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "delete") onDeleteSession(conversation.key);
                  if (key === "rename") onRenameSession(conversation.key);
                  if (key === "pin") onPinSession?.(conversation.key);
                  if (key === "archive") onArchiveSession?.(conversation.key);
                  if (key === "tag") onTagSession?.(conversation.key);
                },
              })
        }
        onActiveChange={(key) => key && onSelectSession(key)}
        style={{
          flex: 1,
          overflowX: "hidden",
          overflowY: "auto",
          padding: collapsed ? "4px 4px" : "4px 6px",
        }}
      />
    </nav>
  );
});
