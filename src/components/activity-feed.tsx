"use client";

import { useMemo, useState, memo } from "react";
import { Typography, Button, Empty, Drawer, Badge, Tag, Tooltip, Flex, Segmented } from "antd";
import { ClearOutlined, ThunderboltOutlined, DownOutlined, ExportOutlined } from "@ant-design/icons";
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
    case "token_usage":
      return "var(--accent-text)";
    default:
      return "var(--text-muted)";
  }
}

const EVENT_LABELS: Record<string, { zh: string; en: string }> = {
  request: { zh: "发送请求", en: "Request sent" },
  chunk: { zh: "接收数据", en: "Data received" },
  thinking: { zh: "AI 思考中", en: "AI thinking" },
  summary: { zh: "生成摘要", en: "Summary generated" },
  done: { zh: "处理完成", en: "Processing done" },
  error: { zh: "服务端错误", en: "Server error" },
  client_error: { zh: "客户端错误", en: "Client error" },
  token_usage: { zh: "Token 用量", en: "Token usage" },
  message: { zh: "消息事件", en: "Message event" },
};

function getEventLabel(type: string): string {
  return EVENT_LABELS[type]?.zh ?? type;
}

export function formatPayload(payload: unknown): string {
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function formatTokenPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof p.prompt_tokens === "number")
    parts.push(`Prompt: ${p.prompt_tokens}`);
  if (typeof p.completion_tokens === "number")
    parts.push(`Completion: ${p.completion_tokens}`);
  if (typeof p.total_tokens === "number")
    parts.push(`Total: ${p.total_tokens}`);
  if (typeof p.tools_count === "number" && p.tools_count > 0)
    parts.push(`Tools: ${p.tools_count}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

type FilterType = "all" | "request" | "thinking" | "data" | "token_usage" | "error";

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
  const tokenText = evt.type === "token_usage" ? formatTokenPayload(evt.payload) : null;
  const text = tokenText ?? formatPayload(evt.payload);
  const isLong = text.length > 200;

  const color = eventColor(evt.type);

  return (
    <div className="activity-card">
      <div className="activity-card-dot" style={{ background: color }} />
      <div className="activity-card-body">
        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
          <Flex align="center" gap={6}>
            <Typography.Text
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: color,
              }}
            >
              {getEventLabel(evt.type)}
            </Typography.Text>
            <Tag
              style={{
                fontSize: 10,
                lineHeight: "16px",
                padding: "0 4px",
                margin: 0,
                borderRadius: 4,
                textTransform: "uppercase",
                fontFamily: "var(--font-mono), ui-monospace, monospace",
              }}
            >
              {evt.type}
            </Tag>
          </Flex>
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
              maxHeight: expanded || !isLong ? "none" : 52,
              overflow: "hidden",
              ...(isLong && !expanded
                ? {
                    maskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                    WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 100%)",
                  }
                : {}),
            }}
          >
            {text}
          </pre>
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
              padding: "2px 0 0",
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
          data-testid="activity-button"
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
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    let list = [...events].reverse();
    switch (filter) {
      case "request":
        list = list.filter((e) => e.type === "request" || e.type === "done");
        break;
      case "thinking":
        list = list.filter((e) => e.type === "thinking");
        break;
      case "data":
        list = list.filter((e) => e.type === "chunk" || e.type === "summary");
        break;
      case "token_usage":
        list = list.filter((e) => e.type === "token_usage");
        break;
      case "error":
        list = list.filter((e) => e.type === "error" || e.type === "client_error");
        break;
    }
    return list;
  }, [events, filter]);

  const handleExport = () => {
    const content = JSON.stringify(events, null, 2);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
          <Flex gap={4}>
            <Tooltip title={t("exportJson")}>
              <Button
                size="small"
                icon={<ExportOutlined />}
                onClick={handleExport}
                type="text"
                disabled={events.length === 0}
              />
            </Tooltip>
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
        </Flex>
      }
      placement="right"
      open={open}
      onClose={onToggle}
      closable
      styles={{
        wrapper: { width: 400 },
        header: { padding: "10px 16px" },
        body: { padding: "12px 16px" },
      }}
      data-testid="activity-feed-drawer"
    >
      <Segmented
        size="small"
        value={filter}
        onChange={(v) => setFilter(v as FilterType)}
        options={[
          { label: t("filterAll"), value: "all" },
          { label: t("filterRequests"), value: "request" },
          { label: t("filterThinking"), value: "thinking" },
          { label: t("filterData"), value: "data" },
          { label: t("filterTokens"), value: "token_usage" },
          { label: t("filterErrors"), value: "error" },
        ]}
        style={{ marginBottom: 12, width: "100%" }}
        block
      />
      {filtered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("noEvents")}
          style={{ marginTop: 60 }}
        />
      ) : (
        <div className="activity-timeline">
          {filtered.map((evt) => (
            <EventCard
              key={evt.id}
              evt={evt}
              showMoreLabel={t("showMore")}
              showLessLabel={t("showLess")}
              collapseAriaLabel={t("collapsePayload")}
              expandAriaLabel={t("expandPayload")}
            />
          ))}
        </div>
      )}
    </Drawer>
  );
}
