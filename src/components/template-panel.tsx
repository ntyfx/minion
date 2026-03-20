"use client";

import { memo, useState, useCallback, useEffect } from "react";
import {
  Drawer,
  Button,
  Input,
  Empty,
  Flex,
  Typography,
  Modal,
  Popconfirm,
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SendOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  incrementTemplateUse,
  createTemplateId,
} from "@/lib/template-db";
import type { PromptTemplate } from "@/lib/template-db";

interface TemplatePanelProps {
  open: boolean;
  onClose: () => void;
  onUse: (text: string) => void;
}

export function TemplateToggle({ onClick }: { onClick: () => void }) {
  const t = useTranslations("templates");
  return (
    <button
      onClick={onClick}
      className="icon-button"
      aria-label={t("title")}
      title={t("title")}
    >
      <BookOutlined />
    </button>
  );
}

export default memo(function TemplatePanel({
  open,
  onClose,
  onUse,
}: TemplatePanelProps) {
  const t = useTranslations("templates");
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [paramEntries, setParamEntries] = useState<Record<string, string>>({});
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplate | null>(null);

  useEffect(() => {
    if (open) {
      loadTemplates().then((list) =>
        setTemplates(list.sort((a, b) => b.useCount - a.useCount)),
      );
    }
  }, [open]);

  const handleCreate = useCallback(async () => {
    if (!newName.trim() || !newContent.trim()) return;
    const paramMatches = newContent.match(/\{(\w+)\}/g) ?? [];
    const params = [...new Set(paramMatches.map((m) => m.slice(1, -1)))].map(
      (key) => ({ key, label: key }),
    );
    const tmpl: PromptTemplate = {
      id: createTemplateId(),
      name: newName.trim(),
      content: newContent.trim(),
      params,
      useCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveTemplate(tmpl);
    setTemplates((prev) => [tmpl, ...prev]);
    setNewName("");
    setNewContent("");
    setCreateOpen(false);
  }, [newName, newContent]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteTemplate(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUse = useCallback(
    async (tmpl: PromptTemplate) => {
      if (tmpl.params && tmpl.params.length > 0) {
        setActiveTemplate(tmpl);
        setParamEntries({});
        return;
      }
      await incrementTemplateUse(tmpl.id);
      onUse(tmpl.content);
      onClose();
    },
    [onUse, onClose],
  );

  const handleParamSubmit = useCallback(async () => {
    if (!activeTemplate) return;
    let result = activeTemplate.content;
    for (const p of activeTemplate.params ?? []) {
      const val = paramEntries[p.key] ?? p.defaultValue ?? "";
      result = result.replace(new RegExp(`\\{${p.key}\\}`, "g"), val);
    }
    await incrementTemplateUse(activeTemplate.id);
    onUse(result);
    setActiveTemplate(null);
    onClose();
  }, [activeTemplate, paramEntries, onUse, onClose]);

  return (
    <>
      <Drawer
        title={
          <Flex justify="space-between" align="center" style={{ width: "100%" }}>
            <Typography.Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {t("title")}
            </Typography.Text>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              {t("create")}
            </Button>
          </Flex>
        }
        open={open}
        onClose={onClose}
        placement="right"
        styles={{
          wrapper: { width: 360 },
          header: { padding: "10px 16px" },
          body: { padding: "12px 16px" },
        }}
      >
        {templates.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("empty")}
            style={{ marginTop: 60 }}
          />
        ) : (
          <Flex vertical gap={8}>
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="template-card">
                <Flex justify="space-between" align="center">
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {tmpl.name}
                  </Typography.Text>
                  <Flex gap={4}>
                    {tmpl.useCount > 0 && (
                      <Tag style={{ margin: 0, fontSize: 11 }}>
                        {t("usedCount", { count: tmpl.useCount })}
                      </Tag>
                    )}
                  </Flex>
                </Flex>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 4 }}
                  ellipsis
                >
                  {tmpl.content}
                </Typography.Text>
                {tmpl.params && tmpl.params.length > 0 && (
                  <Flex gap={4} style={{ marginTop: 4 }}>
                    {tmpl.params.map((p) => (
                      <Tag key={p.key} color="processing" style={{ fontSize: 11, margin: 0 }}>
                        {"{" + p.key + "}"}
                      </Tag>
                    ))}
                  </Flex>
                )}
                <Flex gap={4} style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleUse(tmpl)}
                  >
                    {t("use")}
                  </Button>
                  <Popconfirm
                    title={t("deleteConfirm")}
                    onConfirm={() => handleDelete(tmpl.id)}
                    okText={t("yes")}
                    cancelText={t("no")}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Flex>
              </div>
            ))}
          </Flex>
        )}
      </Drawer>

      <Modal
        title={t("createTemplate")}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText={t("save")}
        okButtonProps={{ disabled: !newName.trim() || !newContent.trim() }}
        destroyOnHidden
      >
        <Flex vertical gap={12}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              {t("nameLabel")}
            </Typography.Text>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("namePlaceholder")}
              maxLength={60}
            />
          </div>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              {t("contentLabel")}
            </Typography.Text>
            <Input.TextArea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder={t("contentPlaceholder")}
              rows={4}
              maxLength={500}
            />
          </div>
        </Flex>
      </Modal>

      <Modal
        title={t("fillParams")}
        open={!!activeTemplate}
        onCancel={() => setActiveTemplate(null)}
        onOk={handleParamSubmit}
        okText={t("send")}
        destroyOnHidden
      >
        {activeTemplate && (
          <Flex vertical gap={12}>
            {(activeTemplate.params ?? []).map((p) => (
              <div key={p.key}>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
                  {p.label}
                </Typography.Text>
                <Input
                  value={paramEntries[p.key] ?? ""}
                  onChange={(e) =>
                    setParamEntries((prev) => ({ ...prev, [p.key]: e.target.value }))
                  }
                  placeholder={p.defaultValue || p.key}
                />
              </div>
            ))}
          </Flex>
        )}
      </Modal>
    </>
  );
});
