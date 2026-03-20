"use client";

import { memo, useState, useCallback, useEffect, useMemo } from "react";
import {
  Drawer,
  Empty,
  Flex,
  Typography,
  Tag,
  Input,
  Popconfirm,
  Button,
  Tooltip,
  message,
} from "antd";
import {
  DeleteOutlined,
  CopyOutlined,
  StarOutlined,
  SendOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import {
  loadBookmarks,
  deleteBookmark,
} from "@/lib/bookmark-db";
import type { Bookmark } from "@/lib/bookmark-db";

interface BookmarkPanelProps {
  open: boolean;
  onClose: () => void;
  onInsert?: (text: string) => void;
}

export function BookmarkToggle({ onClick }: { onClick: () => void }) {
  const t = useTranslations("bookmarks");
  return (
    <Tooltip title={t("title")}>
      <button
        onClick={onClick}
        className="icon-button"
        aria-label={t("title")}
      >
        <StarOutlined />
      </button>
    </Tooltip>
  );
}

export default memo(function BookmarkPanel({
  open,
  onClose,
  onInsert,
}: BookmarkPanelProps) {
  const t = useTranslations("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (open) {
      loadBookmarks().then((list) =>
        setBookmarks(list.sort((a, b) => b.createdAt - a.createdAt)),
      );
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return bookmarks;
    const q = search.toLowerCase();
    return bookmarks.filter(
      (b) =>
        b.content.toLowerCase().includes(q) ||
        b.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        b.sessionLabel.toLowerCase().includes(q),
    );
  }, [bookmarks, search]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleCopy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        messageApi.success(t("copied"));
      } catch {
        messageApi.error("Copy failed");
      }
    },
    [t, messageApi],
  );

  const handleInsert = useCallback(
    (text: string) => {
      onInsert?.(text);
      onClose();
    },
    [onInsert, onClose],
  );

  return (
    <Drawer
      title={
        <Flex justify="space-between" align="center" style={{ width: "100%" }}>
          <Flex align="center" gap={8}>
            <Typography.Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {t("title")}
            </Typography.Text>
            {bookmarks.length > 0 && (
              <Tag
                style={{
                  fontSize: 11, lineHeight: "18px", padding: "0 6px",
                  borderRadius: 10, margin: 0,
                  background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                  color: "var(--accent)", border: "none",
                }}
              >
                {bookmarks.length}
              </Tag>
            )}
          </Flex>
        </Flex>
      }
      open={open}
      onClose={onClose}
      placement="right"
      styles={{
        wrapper: { width: 380 },
        header: { padding: "10px 16px" },
        body: { padding: "12px 16px" },
      }}
    >
      {contextHolder}
      <Input
        size="small"
        prefix={<SearchOutlined style={{ color: "var(--text-muted)", fontSize: 12 }} />}
        placeholder={t("search")}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 12, borderRadius: 8 }}
      />
      {filtered.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t("empty")}
          style={{ marginTop: 60 }}
        />
      ) : (
        <Flex vertical gap={8}>
          {filtered.map((bm) => (
            <div key={bm.id} className="template-card">
              <Flex justify="space-between" align="start">
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11 }}
                >
                  {bm.sessionLabel} · {new Date(bm.createdAt).toLocaleDateString()}
                </Typography.Text>
              </Flex>
              <Typography.Paragraph
                style={{ fontSize: 13, margin: "4px 0 0", color: "var(--text-primary)" }}
                ellipsis={{ rows: 3 }}
              >
                {bm.content}
              </Typography.Paragraph>
              {bm.tags.length > 0 && (
                <Flex gap={4} style={{ marginTop: 4 }}>
                  {bm.tags.map((tag) => (
                    <Tag key={tag} style={{ fontSize: 10, margin: 0 }}>{tag}</Tag>
                  ))}
                </Flex>
              )}
              <Flex gap={4} style={{ marginTop: 6 }}>
                <Tooltip title={t("insertToChat")}>
                  <Button size="small" type="text" icon={<SendOutlined />} onClick={() => handleInsert(bm.content)} />
                </Tooltip>
                <Tooltip title={t("copyContent")}>
                  <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => handleCopy(bm.content)} />
                </Tooltip>
                <Popconfirm title={t("deleteConfirm")} onConfirm={() => handleDelete(bm.id)} okText={t("yes")} cancelText={t("no")}>
                  <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Flex>
            </div>
          ))}
        </Flex>
      )}
    </Drawer>
  );
});
