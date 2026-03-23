"use client";

import { useMemo, useCallback, useState, memo, useRef } from "react";
import { useHover } from "ahooks";
import { Bubble, Sender, Welcome, Think, Prompts } from "@ant-design/x";
import { XMarkdown } from "@ant-design/x-markdown";
import "@ant-design/x-markdown/themes/dark.css";
import { RichContent } from "@/components/rich-content/rich-content";
import { SlashCommandPopup, SystemMentionPopup } from "@/components/slash-command-popup";
import {
  matchSlashCommands,
  matchSystemNames,
  resolveSlashCommand,
  applySystemMention,
} from "@/lib/slash-commands";
import type { SlashCommand } from "@/lib/slash-commands";
import { Typography, Avatar, Flex, Button, message, Tooltip } from "antd";
import {
  RobotOutlined,
  UserOutlined,
  WarningOutlined,
  BulbOutlined,
  FileTextOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  CopyOutlined,
  CheckOutlined,
  ReloadOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { formatTokenCount, getTokenUsage, isSSEChunkPayload } from "@/lib/utils";
import type { Session, ChatMessage, TokenUsage } from "@/types/chat";

function buildTokenUsageByRound(session: Session): TokenUsage[] {
  const rounds: TokenUsage[] = [];
  let current: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0, rounds: 0, toolsCalls: 0 };
  let hasUsage = false;

  for (const evt of session.activity) {
    if (evt.type === "request" && hasUsage) {
      rounds.push(current);
      current = { promptTokens: 0, completionTokens: 0, totalTokens: 0, rounds: 0, toolsCalls: 0 };
      hasUsage = false;
    } else if (evt.type === "token_usage" && isSSEChunkPayload(evt.payload)) {
      const usage = getTokenUsage(evt.payload);
      current.promptTokens += usage.prompt_tokens;
      current.completionTokens += usage.completion_tokens;
      current.totalTokens += usage.total_tokens;
      current.toolsCalls += usage.tools_count;
      hasUsage = true;
    } else if (evt.type === "done" && isSSEChunkPayload(evt.payload)) {
      const usage = getTokenUsage(evt.payload);
      current.rounds = usage.rounds > 0 ? usage.rounds : current.rounds + 1;
    }
  }

  if (hasUsage) {
    rounds.push(current);
  }

  return rounds;
}

interface ChatPanelProps {
  session: Session | null;
  isStreaming: boolean;
  streamingContent: string;
  reasoningContent: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSend: (message: string) => void;
  onResend: (message: string) => void;
  onStop: () => void;
  onBookmark?: (content: string, messageId: string) => void;
  bookmarkedMessageIds?: Set<string>;
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

const MessageToolbar = memo(function MessageToolbar({
  content,
  tokenUsage,
  visible,
  onBookmark,
  isBookmarked,
}: {
  content: string;
  tokenUsage: TokenUsage | null;
  visible: boolean;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [justBookmarked, setJustBookmarked] = useState(false);
  const t = useTranslations("chat");
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(String(content));
      setCopied(true);
      messageApi.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
      messageApi.error("Failed to copy");
    }
  }, [content, t, messageApi]);

  const handleBookmark = useCallback(() => {
    if (onBookmark) {
      onBookmark();
      setJustBookmarked(true);
      messageApi.success(t("bookmarked"));
      setTimeout(() => setJustBookmarked(false), 2000);
    }
  }, [onBookmark, t, messageApi]);

  const bookmarked = isBookmarked || justBookmarked;

  const hasUsage = tokenUsage && tokenUsage.totalTokens > 0;

  return (
    <>
      {contextHolder}
      <div
        className="message-toolbar"
        style={{
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? "auto" : "none",
        }}
      >
        <div className="message-toolbar-actions">
          <Tooltip title={copied ? t("copied") : t("copy")} placement="bottom">
            <button
              className="toolbar-action-btn"
              onClick={handleCopy}
              aria-label={copied ? t("copied") : t("copy")}
              style={{
                color: copied ? "var(--accent)" : undefined,
              }}
            >
              {copied ? (
                <CheckOutlined style={{ fontSize: 12 }} />
              ) : (
                <CopyOutlined style={{ fontSize: 12 }} />
              )}
            </button>
          </Tooltip>
          {onBookmark && (
            <Tooltip title={bookmarked ? t("bookmarked") : t("bookmark")} placement="bottom">
              <button
                className="toolbar-action-btn"
                onClick={handleBookmark}
                aria-label={t("bookmark")}
                style={{ color: bookmarked ? "var(--warning)" : undefined }}
              >
                <StarOutlined style={{ fontSize: 12 }} />
              </button>
            </Tooltip>
          )}
        </div>

        {hasUsage && (
          <div className="message-toolbar-usage">
            <Tooltip title={t("tokenPrompt")} placement="bottom">
              <span className="usage-chip">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {formatTokenCount(tokenUsage.promptTokens)}
              </span>
            </Tooltip>
            <Tooltip title={t("tokenCompletion")} placement="bottom">
              <span className="usage-chip">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                  <path d="M2 3l4 5-4 5M8 13h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {formatTokenCount(tokenUsage.completionTokens)}
              </span>
            </Tooltip>
            <span className="usage-divider" />
            <Tooltip title={t("tokenTotal")} placement="bottom">
              <span className="usage-chip usage-chip-total">
                {formatTokenCount(tokenUsage.totalTokens)}
              </span>
            </Tooltip>
          </div>
        )}
      </div>
    </>
  );
});

const MarkdownContent = memo(function MarkdownContent({
  content,
  isStreaming,
  tokenUsage,
  onAction,
  onBookmark,
  isBookmarked,
}: {
  content: string;
  isStreaming: boolean;
  tokenUsage: TokenUsage | null;
  onAction?: (message: string) => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isHovered = useHover(containerRef);

  return (
    <div ref={containerRef}>
      {isStreaming ? (
        <XMarkdown
          content={String(content)}
          streaming={{ hasNextChunk: true, enableAnimation: true }}
          openLinksInNewTab
          className="chat-markdown"
        />
      ) : (
        <RichContent content={String(content)} onAction={onAction} />
      )}
      <MessageToolbar
        content={content}
        tokenUsage={isStreaming ? null : tokenUsage}
        visible={isHovered && !isStreaming}
        onBookmark={isStreaming ? undefined : onBookmark}
        isBookmarked={isBookmarked}
      />
    </div>
  );
});

const UserBubbleContent = memo(function UserBubbleContent({
  content,
  onResend,
  isStreaming,
}: {
  content: string;
  onResend: (msg: string) => void;
  isStreaming: boolean;
}) {
  const t = useTranslations("chat");

  return (
    <div className={`user-bubble-wrap${isStreaming ? " is-streaming" : ""}`}>
      <span>{content}</span>
      <div className="user-bubble-resend">
        <Tooltip title={t("resend")} placement="left">
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => onResend(content)}
            disabled={isStreaming}
            aria-label={t("resend")}
            className="resend-btn"
          />
        </Tooltip>
      </div>
    </div>
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

interface BubbleListWithItemsProps {
  bubbleItems: Array<{
    key: string;
    role: string;
    content: string;
    variant?: "filled" | "outlined" | "shadow" | "borderless";
    streaming?: boolean;
    loading?: boolean;
  }>;
  tokenUsageByRound: TokenUsage[];
  isStreaming: boolean;
  onSend: (message: string) => void;
  onBookmark?: (content: string, messageId: string) => void;
  bookmarkedMessageIds?: Set<string>;
  renderAiContent: (content: unknown) => React.ReactNode;
  renderUserContent: (content: unknown) => React.ReactNode;
  thinkingTitle: string;
  collapseLabel: string;
  showAllLabel: string;
  collapseAriaLabel: string;
  expandAriaLabel: string;
}

const BubbleListWithItems = memo(function BubbleListWithItems({
  bubbleItems,
  tokenUsageByRound,
  isStreaming,
  onSend,
  onBookmark,
  bookmarkedMessageIds,
  renderAiContent,
  renderUserContent,
  thinkingTitle,
  collapseLabel,
  showAllLabel,
  collapseAriaLabel,
  expandAriaLabel,
}: BubbleListWithItemsProps) {
  let aiIndex = 0;
  const items = bubbleItems.map((item) => {
    if (item.role === "ai" && item.key === "__streaming__") {
      return { ...item, contentRender: renderAiContent };
    }
    if (item.role === "ai") {
      const usage = tokenUsageByRound[aiIndex] ?? null;
      aiIndex++;
      const msgId = item.key;
      const isBookmarked = bookmarkedMessageIds?.has(msgId);
      return {
        ...item,
        contentRender: (content: unknown) => (
          <MarkdownContent
            content={String(content)}
            isStreaming={false}
            tokenUsage={usage}
            onAction={onSend}
            onBookmark={onBookmark ? () => onBookmark(String(content), msgId) : undefined}
            isBookmarked={isBookmarked}
          />
        ),
      };
    }
    if (item.role === "user") {
      return { ...item, contentRender: renderUserContent };
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
  });

  return <Bubble.List autoScroll items={items} role={ROLE_CONFIG} style={{ flex: 1 }} />;
});

export default function ChatPanel({
  session,
  isStreaming,
  streamingContent,
  reasoningContent,
  inputValue,
  onInputChange,
  onSend,
  onResend,
  onStop,
  onBookmark,
  bookmarkedMessageIds,
}: ChatPanelProps) {
  const t = useTranslations("chat");
  const hasMessages =
    session && (session.messages.length > 0 || isStreaming);

  const tokenUsageByRound = useMemo(
    () => (session ? buildTokenUsageByRound(session) : []),
    [session],
  );

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

  const [slashMatches, setSlashMatches] = useState<SlashCommand[]>([]);
  const [systemMatches, setSystemMatches] = useState<string[]>([]);
  const [popupIndex, setPopupIndex] = useState(0);

  const updatePopups = useCallback((val: string) => {
    const sl = matchSlashCommands(val);
    setSlashMatches(sl);
    const sys = matchSystemNames(val);
    setSystemMatches(sys);
    setPopupIndex(0);
  }, []);

  const handleInputChangeWrapped = useCallback(
    (val: string) => {
      onInputChange(val);
      updatePopups(val);
    },
    [onInputChange, updatePopups],
  );

  const selectSlashCommand = useCallback(
    (cmd: SlashCommand) => {
      const { text, send } = resolveSlashCommand(cmd);
      setSlashMatches([]);
      setSystemMatches([]);
      if (send && text) {
        onInputChange("");
        onSend(text);
      } else {
        onInputChange(text);
      }
    },
    [onInputChange, onSend],
  );

  const selectSystemMention = useCallback(
    (sys: string) => {
      const next = applySystemMention(inputValue, sys);
      onInputChange(next);
      setSlashMatches([]);
      setSystemMatches([]);
    },
    [inputValue, onInputChange],
  );

  const popupVisible = slashMatches.length > 0 || systemMatches.length > 0;
  const popupItems = slashMatches.length > 0 ? slashMatches : systemMatches;

  const handleKeyDownCapture = useCallback(
    (e: React.KeyboardEvent) => {
      if (!popupVisible) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setPopupIndex((i) => (i + 1) % popupItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setPopupIndex((i) => (i - 1 + popupItems.length) % popupItems.length);
      } else if (e.key === "Tab" || (e.key === "Enter" && popupVisible)) {
        e.preventDefault();
        e.stopPropagation();
        if (slashMatches.length > 0) {
          selectSlashCommand(slashMatches[popupIndex]);
        } else if (systemMatches.length > 0) {
          selectSystemMention(systemMatches[popupIndex]);
        }
      } else if (e.key === "Escape") {
        setSlashMatches([]);
        setSystemMatches([]);
      }
    },
    [popupVisible, popupItems, popupIndex, slashMatches, systemMatches, selectSlashCommand, selectSystemMention],
  );

  const handleSubmit = useCallback(
    (msg: string) => {
      if (popupVisible) return;
      if (!msg.trim()) return;
      setSlashMatches([]);
      setSystemMatches([]);
      onSend(msg.trim());
    },
    [onSend, popupVisible],
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
      <MarkdownContent content={String(content)} isStreaming={isStreaming} tokenUsage={null} onAction={onSend} />
    ),
    [isStreaming, onSend],
  );

  const renderUserContent = useCallback(
    (content: unknown) => (
      <UserBubbleContent
        content={String(content)}
        onResend={onResend}
        isStreaming={isStreaming}
      />
    ),
    [onResend, isStreaming],
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
          <BubbleListWithItems
            bubbleItems={bubbleItems}
            tokenUsageByRound={tokenUsageByRound}
            isStreaming={isStreaming}
            onSend={onSend}
            onBookmark={onBookmark}
            bookmarkedMessageIds={bookmarkedMessageIds}
            renderAiContent={renderAiContent}
            renderUserContent={renderUserContent}
            thinkingTitle={thinkingTitle}
            collapseLabel={collapseLabel}
            showAllLabel={showAllLabel}
            collapseAriaLabel={collapseAriaLabel}
            expandAriaLabel={expandAriaLabel}
          />
        )}
      </Flex>

      <div style={{ padding: "8px 20px 16px", flexShrink: 0 }} onKeyDownCapture={handleKeyDownCapture}>
        <div style={{ position: "relative" }}>
          {slashMatches.length > 0 && (
            <SlashCommandPopup
              commands={slashMatches}
              selectedIndex={popupIndex}
              onSelect={selectSlashCommand}
            />
          )}
          {systemMatches.length > 0 && slashMatches.length === 0 && (
            <SystemMentionPopup
              systems={systemMatches}
              selectedIndex={popupIndex}
              onSelect={selectSystemMention}
            />
          )}
          <div className="sender-glow-wrapper">
            <Sender
              value={inputValue}
              onChange={handleInputChangeWrapped}
              onSubmit={handleSubmit}
              onCancel={onStop}
              loading={isStreaming}
              placeholder={t("placeholder")}
              submitType="enter"
            />
          </div>
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
