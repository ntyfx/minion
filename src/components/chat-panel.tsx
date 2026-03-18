"use client";

import { useMemo, useCallback, useState, memo } from "react";
import { Bubble, Sender, Welcome, Think, Prompts } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import "@ant-design/x-markdown/themes/dark.css";
import { Typography, Avatar, Flex } from "antd";
import {
  RobotOutlined,
  UserOutlined,
  WarningOutlined,
  BulbOutlined,
  FileTextOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
} from "@ant-design/icons";
import type { Session, ChatMessage } from "@/types/chat";

interface ChatPanelProps {
  session: Session | null;
  isStreaming: boolean;
  streamingContent: string;
  reasoningContent: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: (message: string) => void;
  onStop: () => void;
}

export function mapRole(msg: ChatMessage) {
  switch (msg.role) {
    case "user":
      return "user";
    case "assistant":
      return "ai";
    case "reasoning":
      return "reasoning";
    case "error":
      return "error";
    case "system":
    default:
      return "system";
  }
}

const PROMPTS_ITEMS = [
  {
    key: "1",
    icon: <FileTextOutlined style={{ fontSize: 15, color: "var(--text-secondary)" }} />,
    label: "说明分析",
    description: "帮我画 E-system 到 Adnext 的流程图",
  },
  {
    key: "2",
    icon: <SearchOutlined style={{ fontSize: 15, color: "var(--text-secondary)" }} />,
    label: "查询数据",
    description: "查 appId=vividarmy 在 Adnext 的 campaign",
  },
  {
    key: "3",
    icon: <ThunderboltOutlined style={{ fontSize: 15, color: "var(--text-secondary)" }} />,
    label: "执行变更",
    description: "帮我创建一个 campaign",
  },
  {
    key: "4",
    icon: <ApartmentOutlined style={{ fontSize: 15, color: "var(--text-secondary)" }} />,
    label: "跨系统协作",
    description: "帮我检查 Artifex → E-system → Box → Adnext 链路",
  },
];

const MarkdownContent = memo(function MarkdownContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  return (
    <XMarkdown
      content={String(content)}
      streaming={
        isStreaming
          ? { hasNextChunk: true, enableAnimation: true }
          : undefined
      }
      openLinksInNewTab
      className="chat-markdown"
    />
  );
});

const LINE_HEIGHT = 1.7;
const FONT_SIZE = 12;
const MAX_LINES = 5;
const COLLAPSED_HEIGHT = Math.round(FONT_SIZE * LINE_HEIGHT * MAX_LINES);

function ThinkContent({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const lineCount = text.split("\n").length;
  const needsCollapse = lineCount > MAX_LINES;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          maxHeight: !expanded && needsCollapse ? COLLAPSED_HEIGHT : undefined,
          overflow: !expanded && needsCollapse ? "auto" : undefined,
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: FONT_SIZE,
          color: "var(--text-secondary)",
          lineHeight: LINE_HEIGHT,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
      {needsCollapse && (
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse thinking content" : "Expand thinking content"}
          style={{
            background: "none",
            border: "none",
            padding: "4px 0 0",
            fontSize: 11,
            color: "var(--accent-text)",
            cursor: "pointer",
            fontFamily: "var(--font-mono), ui-monospace, monospace",
          }}
        >
          {expanded ? "Collapse" : "Show all"}
        </button>
      )}
    </div>
  );
}

const WELCOME_ICON = (
  <Avatar
    icon={<RobotOutlined />}
    size={56}
    style={{
      background: "var(--accent)",
      color: "var(--text-inverse)",
      fontSize: 24,
    }}
  />
);

const ROLE_CONFIG = {
  ai: {
    placement: "start" as const,
    avatar: (
      <Avatar
        icon={<RobotOutlined />}
        size={34}
        style={{
          background: "var(--accent)",
          color: "var(--text-inverse)",
          fontSize: 15,
        }}
      />
    ),
    style: { maxWidth: "80%" },
    styles: {
      content: {
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "12px 12px 12px 4px",
        color: "var(--text-primary)",
        padding: "12px 16px",
      },
    },
  },
  user: {
    placement: "end" as const,
    avatar: (
      <Avatar
        icon={<UserOutlined />}
        size={34}
        style={{
          background: "var(--accent-subtle)",
          color: "var(--accent)",
          fontSize: 15,
        }}
      />
    ),
    style: { maxWidth: "80%" },
    styles: {
      content: {
        background: "var(--accent-subtle)",
        border: "1px solid var(--border)",
        borderRadius: "12px 12px 4px 12px",
        color: "var(--text-primary)",
        padding: "12px 16px",
      },
    },
  },
  reasoning: {
    placement: "start" as const,
    avatar: (
      <Avatar
        icon={<BulbOutlined />}
        size={34}
        style={{
          background: "var(--accent-subtle)",
          color: "var(--accent)",
          fontSize: 15,
        }}
      />
    ),
    style: {
      maxWidth: "80%",
      alignItems: "flex-start" as const,
    },
    styles: {
      content: {
        background: "transparent",
        border: "none",
        padding: "5px 0 0",
        boxShadow: "none",
        minHeight: "auto",
      },
    },
  },
  error: {
    placement: "start" as const,
    avatar: (
      <Avatar
        icon={<WarningOutlined />}
        size={34}
        style={{
          background: "var(--error-subtle)",
          color: "var(--error)",
          fontSize: 15,
        }}
      />
    ),
    styles: {
      content: {
        background: "var(--error-subtle)",
        border: "1px solid var(--error-border)",
        borderRadius: "12px 12px 12px 4px",
        color: "var(--error)",
        fontFamily: "var(--font-mono), ui-monospace, monospace",
        fontSize: 13,
        padding: "12px 16px",
      },
    },
  },
};

const WELCOME_STYLES = {
  title: {
    color: "var(--text-primary)",
    fontSize: 24,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    textWrap: "balance" as const,
  },
  description: {
    maxWidth: 480,
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    textWrap: "pretty" as const,
  },
};

export default function ChatPanel({
  session,
  isStreaming,
  streamingContent,
  reasoningContent,
  inputValue,
  onInputChange,
  onSend,
  onStop,
}: ChatPanelProps) {
  const hasMessages =
    session && (session.messages.length > 0 || isStreaming);

  const bubbleItems = useMemo(() => {
    if (!session) return [];

    const items: Array<{
      key: string;
      role: string;
      content: string;
      variant?: "filled" | "outlined" | "shadow" | "borderless";
      streaming?: boolean;
      loading?: boolean;
    }> = session.messages.map((msg) => ({
      key: msg.id,
      role: mapRole(msg),
      content: msg.content,
    }));

    if (isStreaming && reasoningContent) {
      items.push({
        key: "__reasoning__",
        role: "reasoning",
        content: reasoningContent,
        streaming: true,
      });
    }

    if (isStreaming) {
      items.push({
        key: "__streaming__",
        role: "ai",
        content: streamingContent || "",
        streaming: true,
        loading: !streamingContent,
      });
    }

    return items;
  }, [session, isStreaming, streamingContent, reasoningContent]);

  const handleSubmit = useCallback(
    (msg: string) => {
      if (!msg.trim()) return;
      onSend(msg.trim());
    },
    [onSend],
  );

  const handlePromptClick = useCallback(
    (info: { data: { description?: React.ReactNode } }) => {
      if (typeof info.data.description === "string") {
        onSend(info.data.description);
      }
    },
    [onSend],
  );

  const renderAiContent = useCallback(
    (content: unknown) => (
      <MarkdownContent content={String(content)} isStreaming={isStreaming} />
    ),
    [isStreaming],
  );

  const renderCompletedAiContent = useCallback(
    (content: unknown) => (
      <MarkdownContent content={String(content)} isStreaming={false} />
    ),
    [],
  );

  if (!session) {
    return (
      <Flex
        vertical
        align="center"
        justify="center"
        style={{ height: "100%", padding: 40 }}
      >
        <Welcome
          icon={WELCOME_ICON}
          title="Minion Chat"
          description="从左侧选择一个对话，或新建对话开始使用。"
          variant="borderless"
          styles={{
            ...WELCOME_STYLES,
            description: { ...WELCOME_STYLES.description, maxWidth: 420 },
          }}
        />
      </Flex>
    );
  }

  return (
    <Flex vertical style={{ height: "100%" }}>
      <Flex
        vertical
        style={{ flex: 1, overflow: "hidden", padding: "0 20px" }}
      >
        {!hasMessages ? (
          <Flex
            vertical
            align="center"
            justify="center"
            gap={28}
            style={{ flex: 1 }}
          >
            <Welcome
              icon={WELCOME_ICON}
              title="有什么可以帮你？"
              description="我可以帮你做说明分析、查询系统数据、执行变更操作，也能协调跨系统链路。告诉我目标系统和操作类型即可。"
              variant="borderless"
              styles={WELCOME_STYLES}
            />
            <Prompts
              items={PROMPTS_ITEMS}
              onItemClick={handlePromptClick}
              wrap
              styles={{
                item: {
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                },
              }}
            />
          </Flex>
        ) : (
          <Bubble.List
            autoScroll
            items={bubbleItems.map((item) => {
              if (item.role === "ai" && item.key === "__streaming__") {
                return { ...item, contentRender: renderAiContent };
              }
              if (item.role === "ai") {
                return { ...item, contentRender: renderCompletedAiContent };
              }
              if (item.role === "reasoning") {
                const isLive = item.key === "__reasoning__";
                return {
                  ...item,
                  contentRender: (content: unknown) => (
                    <Think
                      title="Thinking"
                      loading={isLive && isStreaming}
                      defaultExpanded={false}
                    >
                      <ThinkContent text={String(content)} />
                    </Think>
                  ),
                };
              }
              return item;
            })}
            role={ROLE_CONFIG}
            style={{ flex: 1 }}
          />
        )}
      </Flex>

      <div style={{ padding: "8px 20px 16px", flexShrink: 0 }}>
        <Sender
          value={inputValue}
          onChange={(val: string) => onInputChange(val)}
          onSubmit={handleSubmit}
          onCancel={onStop}
          loading={isStreaming}
          placeholder="输入你的目标，例如：查 appId=seirei 的项目列表"
          submitType="enter"
        />
        <Typography.Text
          type="secondary"
          style={{
            display: "block",
            textAlign: "center",
            fontSize: 11,
            marginTop: 6,
            color: "var(--text-muted)",
          }}
        >
          Enter 发送 · Shift+Enter 换行 · 变更操作会先出计划等你确认
        </Typography.Text>
      </div>
    </Flex>
  );
}
