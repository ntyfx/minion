"use client";

import { useMemoizedFn } from "ahooks";
import { Dropdown, Tooltip } from "antd";
import {
  ShareAltOutlined,
  ExportOutlined,
  FileMarkdownOutlined,
  FileTextOutlined,
  Html5Outlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { downloadMarkdown, downloadJson, downloadHtml } from "@/lib/export";
import type { Session } from "@/types/chat";

type ExportFormat = "share" | "markdown" | "markdown-ai" | "json" | "html";

interface ShareDropdownProps {
  activeSession: Session | null;
  onShare: () => void;
  t: (key: string) => string;
}

export function ShareDropdown({ activeSession, onShare, t }: ShareDropdownProps) {
  const te = useTranslations("export");

  const handleExport = useMemoizedFn((format: ExportFormat) => {
    if (!activeSession) return;
    switch (format) {
      case "share":
        onShare();
        break;
      case "markdown":
        downloadMarkdown(activeSession);
        break;
      case "markdown-ai":
        downloadMarkdown(activeSession, "assistant");
        break;
      case "json":
        downloadJson(activeSession);
        break;
      case "html":
        downloadHtml(activeSession);
        break;
    }
  });

  const items = [
    { key: "share", label: t("exportSession"), icon: <ExportOutlined /> },
    { type: "divider" as const },
    { key: "markdown", label: te("markdown"), icon: <FileMarkdownOutlined /> },
    { key: "markdown-ai", label: te("markdownAiOnly"), icon: <FileMarkdownOutlined /> },
    { key: "json", label: te("json"), icon: <FileTextOutlined /> },
    { key: "html", label: te("html"), icon: <Html5Outlined /> },
  ];

  const disabled = !activeSession || activeSession.messages.length === 0;

  return (
    <Dropdown
      menu={{ items, onClick: ({ key }) => handleExport(key as ExportFormat) }}
      trigger={["click"]}
      disabled={disabled}
    >
      <Tooltip title={t("share")}>
        <button
          className="icon-button"
          aria-label={t("share")}
          style={{ opacity: activeSession?.messages.length ? 1 : 0.4 }}
        >
          <ShareAltOutlined />
        </button>
      </Tooltip>
    </Dropdown>
  );
}

export default ShareDropdown;
