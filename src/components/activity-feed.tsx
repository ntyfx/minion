"use client";

import { useMemo, useState, memo } from "react";
import { Typography, Button, Empty, Drawer, Badge, Tag, Tooltip, Flex } from "antd";
import { ClearOutlined, ThunderboltOutlined, DownOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
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

const EventCard = memo(function EventCard({
  evt,
  showMoreLabel,
  showLessLabel,
  collapseAriaLabel,
  expandAriaLabel,
}: {
  evt: ActivityEvent;
  showMoreLabel: string;
  showLessLabel: string;
  collapseAriaLabel: string;
  expandAriaLabel: string;
}) {
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
      <div style={{ position: "relative" }}>
        <pre
          style={{
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
            fontSize: 11,
            color: "var(--text-secondary)",
            lineHeight: 1.55,
            maxHeight: expanded || !isLong ? "none" : 68,
            overflow: "hidden",
          }}
        >
          {text}
        </pre>
        {isLong && !expanded && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 28,
              background: "linear-gradient(transparent, var(--bg-elevated))",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label={expanded ? collapseAriaLabel : expandAriaLabel}
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
          {expanded ? showLessLabel : showMoreLabel}
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
  const t = useTranslations("activity");
  return (
    <Tooltip title={t("title")}>
      <Badge dot={count > 0} offset={[-4, 4]} color="var(--accent)">
        <button
          onClick={onClick}
          className="icon-button"
          aria-label={t("openFeed")}
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
  const t = useTranslations("activity");
  const reversed = useMemo(() => [...events].reverse(), [events]);

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <Flex align="center" gap={8}>
            <Typography.Text
              strong
              style={{ fontSize: 14, color: "var(--text-primary)" }}
            >
              {t("title")}
            </Typography.Text>
            {events.length > 0 && (
              <Tag
                style={{
                  fontSize: 11,
                  lineHeight: "18px",
                  padding: "0 6px",
                  borderRadius: 10,
                  margin: 0,
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)",
                  border: "none",
                }}
              >
                {events.length}
              </Tag>
            )}
          </Flex>
          <Button
            size="small"
            icon={<ClearOutlined />}
            onClick={onClear}
            type="text"
            aria-label={t("clearAll")}
          >
            {t("clear")}
          </Button>
        </Flex>
      }
      placement="right"
      open={open}
      onClose={onToggle}
      closable
      styles={{
        wrapper: { width: 380 },
        header: { padding: "10px 16px" },
        body: { padding: "12px 16px" },
      }}
    >
      {reversed.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("noEvents")}
          style={{ marginTop: 60 }}
        />
      ) : (
        <Flex vertical gap={0}>
          {reversed.map((evt) => (
            <EventCard
              key={evt.id}
              evt={evt}
              showMoreLabel={t("showMore")}
              showLessLabel={t("showLess")}
              collapseAriaLabel={t("collapsePayload")}
              expandAriaLabel={t("expandPayload")}
            />
          ))}
        </Flex>
      )}
    </Drawer>
  );
}
