"use client";

import { memo, useCallback } from "react";
import { Dropdown, Tooltip } from "antd";
import { ExportOutlined, FileMarkdownOutlined, FileTextOutlined, Html5Outlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { downloadMarkdown, downloadJson, downloadHtml } from "@/lib/export";
import type { Session } from "@/types/chat";

interface ExportMenuProps {
  session: Session | null;
}

export const ExportMenu = memo(function ExportMenu({ session }: ExportMenuProps) {
  const t = useTranslations("export");

  const handleExport = useCallback(
    (format: string) => {
      if (!session) return;
      switch (format) {
        case "markdown":
          downloadMarkdown(session);
          break;
        case "markdown-ai":
          downloadMarkdown(session, "assistant");
          break;
        case "json":
          downloadJson(session);
          break;
        case "html":
          downloadHtml(session);
          break;
      }
    },
    [session],
  );

  const items = [
    { key: "markdown", label: t("markdown"), icon: <FileMarkdownOutlined /> },
    { key: "markdown-ai", label: t("markdownAiOnly"), icon: <FileMarkdownOutlined /> },
    { key: "json", label: t("json"), icon: <FileTextOutlined /> },
    { key: "html", label: t("html"), icon: <Html5Outlined /> },
  ];

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => handleExport(key),
      }}
      trigger={["click"]}
      disabled={!session || session.messages.length === 0}
    >
      <Tooltip title={t("title")}>
        <button
          className="icon-button"
          aria-label={t("title")}
          style={{ opacity: session?.messages.length ? 1 : 0.4 }}
        >
          <ExportOutlined />
        </button>
      </Tooltip>
    </Dropdown>
  );
});
