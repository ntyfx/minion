"use client";

import { useMemo, memo } from "react";
import { Conversations } from "@ant-design/x";
import { Tooltip } from "antd";
import { useTranslations } from "next-intl";
import type { Session } from "@/types/chat";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { getChatIcon } from "@/lib/chat-icons";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  collapsed?: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string) => void;
}

export function getTimeGroup(
  ts: number,
  labels: { today: string; yesterday: string; thisWeek: string; earlier: string },
): string {
  const now = Date.now();
  const diff = now - ts;
  const day = 86400000;
  if (diff < day) return labels.today;
  if (diff < 2 * day) return labels.yesterday;
  if (diff < 7 * day) return labels.thisWeek;
  return labels.earlier;
}

export function formatTimeAgo(ts: number, nowLabel: string): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return nowLabel;
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

export default memo(function Sidebar({
  sessions,
  activeSessionId,
  collapsed,
  onSelectSession,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
}: SidebarProps) {
  const t = useTranslations("sidebar");

  const groupLabels = useMemo(
    () => ({
      today: t("today"),
      yesterday: t("yesterday"),
      thisWeek: t("thisWeek"),
      earlier: t("earlier"),
    }),
    [t],
  );

  const items = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((s) =>
          collapsed
            ? {
                key: s.id,
                label: (
                  <Tooltip title={s.label} placement="right">
                    <span style={{ display: "flex", justifyContent: "center", fontSize: 16 }}>
                      {getChatIcon(s.icon)}
                    </span>
                  </Tooltip>
                ),
                group: getTimeGroup(s.updatedAt, groupLabels),
              }
            : {
                key: s.id,
                label: s.label,
                icon: getChatIcon(s.icon),
                group: getTimeGroup(s.updatedAt, groupLabels),
                description: (
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.messages.length > 0
                      ? `${s.messages.length} ${t("msg")} · ${formatTimeAgo(s.updatedAt, t("now"))}`
                      : formatTimeAgo(s.updatedAt, t("now"))}
                  </span>
                ),
              },
        ),
    [sessions, collapsed, groupLabels, t],
  );

  return (
    <nav
      aria-label={t("conversations")}
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Conversations
        activeKey={activeSessionId ?? undefined}
        items={items}
        groupable={
          collapsed
            ? undefined
            : {
                label: (group) => group,
                collapsible: true,
                defaultExpandedKeys: [groupLabels.today],
              }
        }
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
                    key: "delete",
                    label: t("menuDelete"),
                    icon: <DeleteOutlined />,
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === "delete") onDeleteSession(conversation.key);
                  if (key === "rename") onRenameSession(conversation.key);
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
