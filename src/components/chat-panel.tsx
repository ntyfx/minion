"use client";

import { useMemo, useCallback, useState, memo, useRef } from "react";
import { useHover } from "ahooks";
import { Bubble, Sender, Welcome, Think, Prompts } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import "@ant-design/x-markdown/themes/dark.css";
import { Typography, Avatar, Flex, Button, message } from "antd";
import {
  RobotOutlined,
  UserOutlined,
  WarningOutlined,
  BulbOutlined,
  FileTextOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  CopyFilled,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
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

const ICON_STYLE = { fontSize: 15, color: "var(--text-secondary)" };

const MarkdownContent = memo(function MarkdownContent({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useHover(containerRef);
  const t = useTranslations("chat");
  const [messageApi, contextHolder] = message.useMessage();
  
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(content));
      setCopied(true);
      messageApi.success(t("copied"));
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      messageApi.error("Failed to copy");
    }
  }, [content, t, messageApi]);

  return (
    <>
      {contextHolder}
      <div 
        ref={containerRef}
        style={{ position: "relative" }}
      >
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
        <Button
          type="text"
          size="small"
          icon={<CopyFilled style={{ fontSize: 12 }} />}
          onClick={handleCopy}
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            opacity: isHovered ? 1 : 0,
            padding: 0,
            minWidth: "auto",
            width: 24,
            height: 24,
            color: copied ? "var(--accent)" : "var(--text-secondary)",
            transition: "opacity 0.2s ease",
            pointerEvents: isHovered ? "auto" : "none",
          }}
          aria-label={copied ? t("copied") : t("copy")}
          title={copied ? t("copied") : t("copy")}
        />
      </div>
    </>
  );
});

const LINE_HEIGHT = 1.7;
const FONT_SIZE = 12;
const MAX_LINES = 5;
const COLLAPSED_HEIGHT = Math.round(FONT_SIZE * LINE_HEIGHT * MAX_LINES);

function ThinkContent({
  text,
  collapseLabel,
  showAllLabel,
  collapseAriaLabel,
  expandAriaLabel,
}: {
  text: string;
  collapseLabel: string;
  showAllLabel: string;
  collapseAriaLabel: string;
  expandAriaLabel: string;
}) {
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
          aria-label={expanded ? collapseAriaLabel : expandAriaLabel}
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
          {expanded ? collapseLabel : showAllLabel}
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
  const t = useTranslations("chat");
  const hasMessages =
    session && (session.messages.length > 0 || isStreaming);

  const promptsItems = useMemo(
    () => [
      {
        key: "1",
        icon: <FileTextOutlined style={ICON_STYLE} />,
        label: t("promptAnalysis"),
        description: t("promptAnalysisDesc"),
      },
      {
        key: "2",
        icon: <SearchOutlined style={ICON_STYLE} />,
        label: t("promptQuery"),
        description: t("promptQueryDesc"),
      },
      {
        key: "3",
        icon: <ThunderboltOutlined style={ICON_STYLE} />,
        label: t("promptExecute"),
        description: t("promptExecuteDesc"),
      },
      {
        key: "4",
        icon: <ApartmentOutlined style={ICON_STYLE} />,
        label: t("promptOrchestrate"),
        description: t("promptOrchestrateDesc"),
      },
    ],
    [t],
  );

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

  const thinkingTitle = t("thinking");
  const collapseLabel = t("collapse");
  const showAllLabel = t("showAll");
  const collapseAriaLabel = t("collapseThinking");
  const expandAriaLabel = t("expandThinking");

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
          title={t("welcomeTitle")}
          description={t("welcomeNoSession")}
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
              title={t("welcomeEmptyTitle")}
              description={t("welcomeEmptyDesc")}
              variant="borderless"
              styles={WELCOME_STYLES}
            />
            <Prompts
              items={promptsItems}
              onItemClick={handlePromptClick}
              wrap
              styles={{
                item: {
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 9999,
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
                      title={thinkingTitle}
                      loading={isLive && isStreaming}
                      defaultExpanded={false}
                    >
                      <ThinkContent
                        text={String(content)}
                        collapseLabel={collapseLabel}
                        showAllLabel={showAllLabel}
                        collapseAriaLabel={collapseAriaLabel}
                        expandAriaLabel={expandAriaLabel}
                      />
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
        <div className="sender-glow-wrapper">
          <Sender
            value={inputValue}
            onChange={(val: string) => onInputChange(val)}
            onSubmit={handleSubmit}
            onCancel={onStop}
            loading={isStreaming}
            placeholder={t("placeholder")}
            submitType="enter"
          />
        </div>
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
          {t("hint")}
        </Typography.Text>
      </div>
    </Flex>
  );
}
