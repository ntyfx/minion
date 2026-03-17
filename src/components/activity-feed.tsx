"use client";

import { useMemo, useState, memo } from "react";
import { Typography, Button, Empty, Drawer, Badge, Tooltip, Flex } from "antd";
import { ClearOutlined, ThunderboltOutlined, DownOutlined } from "@ant-design/icons";
import type { ActivityEvent } from "@/types/chat";

interface ActivityFeedProps {
  events: ActivityEvent[];
  onClear: () => void;
  open: boolean;
  onToggle: () => void;
}

export function eventColor(type: string): string {
  switch (type) {
    case "error":
    case "client_error":
      return "var(--error)";
    case "done":
      return "var(--accent)";
    case "thinking":
      return "var(--warning)";
    case "chunk":
    case "summary":
      return "var(--info)";
    default:
      return "var(--text-muted)";
  }
}

export function formatPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

const EventCard = memo(function EventCard({ evt }: { evt: ActivityEvent }) {
  const [expanded, setExpanded] = useState(false);
  const text = formatPayload(evt.payload);
  const isLong = text.length > 200;

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderLeft: `2px solid ${eventColor(evt.type)}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
      }}
    >
      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
        <Typography.Text
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            color: eventColor(evt.type),
          }}
        >
          {evt.type}
        </Typography.Text>
        <Typography.Text
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            color: "var(--text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {new Date(evt.timestamp).toLocaleTimeString()}
        </Typography.Text>
      </Flex>
      <pre
        style={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 11,
          color: "var(--text-secondary)",
          lineHeight: 1.55,
          maxHeight: expanded ? "none" : 60,
          overflow: "hidden",
        }}
      >
        {text}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse event payload" : "Expand event payload"}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent-text)",
            fontSize: 11,
            cursor: "pointer",
            padding: "4px 0 0",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <DownOutlined
            style={{
              fontSize: 9,
              transform: expanded ? "rotate(180deg)" : "none",
              transition: "transform 0.15s ease-out",
            }}
          />
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
});

export function ActivityToggle({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <Tooltip title="Activity Feed">
      <Badge count={count} size="small" offset={[-4, 4]} color="var(--accent)">
        <button
          onClick={onClick}
          className="icon-button"
          aria-label="Open activity feed"
        >
          <ThunderboltOutlined />
        </button>
      </Badge>
    </Tooltip>
  );
}

export default function ActivityFeed({
  events,
  onClear,
  open,
  onToggle,
}: ActivityFeedProps) {
  const reversed = useMemo(() => [...events].reverse(), [events]);

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <div>
            <Typography.Text
              strong
              style={{ fontSize: 14, color: "var(--text-primary)" }}
            >
              Activity Feed
            </Typography.Text>
            <Typography.Text
              style={{
                display: "block",
                fontSize: 12,
                marginTop: 2,
                color: "var(--text-muted)",
              }}
            >
              {events.length} event{events.length !== 1 ? "s" : ""}
            </Typography.Text>
          </div>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={onClear}
            type="text"
            aria-label="Clear all events"
          >
            Clear
          </Button>
        </Flex>
      }
      placement="right"
      open={open}
      onClose={onToggle}
      closable
      styles={{
        wrapper: { width: 380 },
        header: { padding: "14px 16px" },
        body: { padding: "12px 16px" },
      }}
    >
      {reversed.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No events yet"
          style={{ marginTop: 60 }}
        />
      ) : (
        <Flex vertical gap={0}>
          {reversed.map((evt) => (
            <EventCard key={evt.id} evt={evt} />
          ))}
        </Flex>
      )}
    </Drawer>
  );
}
