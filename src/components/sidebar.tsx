"use client";

import { useMemo, memo } from "react";
import { Conversations } from "@ant-design/x";
import type { Session } from "@/types/chat";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  collapsed?: boolean;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string) => void;
}

export function getTimeGroup(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const day = 86400000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return "This Week";
  return "Earlier";
}

export function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
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
  const items = useMemo(
    () =>
      [...sessions]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((s) => ({
          key: s.id,
          label: s.label,
          group: getTimeGroup(s.updatedAt),
          description: collapsed ? undefined : (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {s.messages.length > 0
                ? `${s.messages.length} msg · ${formatTimeAgo(s.updatedAt)}`
                : formatTimeAgo(s.updatedAt)}
            </span>
          ),
        })),
    [sessions, collapsed],
  );

  return (
    <nav
      aria-label="Conversations"
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
                defaultExpandedKeys: ["Today"],
              }
        }
        creation={{
          label: collapsed ? undefined : "New Chat",
          onClick: onCreateSession,
        }}
        menu={
          collapsed
            ? undefined
            : (conversation) => ({
                items: [
                  {
                    key: "rename",
                    label: "Rename",
                    icon: <EditOutlined />,
                  },
                  {
                    key: "delete",
                    label: "Delete",
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
        style={{ flex: 1, overflow: "auto", padding: "4px 8px" }}
      />
    </nav>
  );
});
