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
  Steps,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  OrderedListOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import {
  loadSequences,
  saveSequence,
  deleteSequence,
  createSequenceId,
} from "@/lib/sequence-db";
import type { Sequence, SequenceStep } from "@/lib/sequence-db";

interface SequencePanelProps {
  open: boolean;
  onClose: () => void;
  onRun: (messages: string[]) => void;
}

export function SequenceToggle({ onClick }: { onClick: () => void }) {
  const t = useTranslations("sequences");
  return (
    <Tooltip title={t("title")}>
      <button
        onClick={onClick}
        className="icon-button"
        aria-label={t("title")}
      >
        <OrderedListOutlined />
      </button>
    </Tooltip>
  );
}

export default memo(function SequencePanel({
  open,
  onClose,
  onRun,
}: SequencePanelProps) {
  const t = useTranslations("sequences");
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSteps, setNewSteps] = useState<SequenceStep[]>([
    { message: "", waitForDone: true },
  ]);
  const [paramModal, setParamModal] = useState<Sequence | null>(null);
  const [paramEntries, setParamEntries] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadSequences().then((list) =>
        setSequences(list.sort((a, b) => b.useCount - a.useCount)),
      );
    }
  }, [open]);

  const handleCreate = useCallback(async () => {
    const steps = newSteps.filter((s) => s.message.trim());
    if (!newName.trim() || steps.length === 0) return;
    const allText = steps.map((s) => s.message).join(" ");
    const paramMatches = allText.match(/\{(\w+)\}/g) ?? [];
    const params = [...new Set(paramMatches.map((m) => m.slice(1, -1)))].map(
      (key) => ({ key, label: key }),
    );
    const seq: Sequence = {
      id: createSequenceId(),
      name: newName.trim(),
      steps,
      params: params.length > 0 ? params : undefined,
      useCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveSequence(seq);
    setSequences((prev) => [seq, ...prev]);
    setNewName("");
    setNewSteps([{ message: "", waitForDone: true }]);
    setCreateOpen(false);
  }, [newName, newSteps]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteSequence(id);
    setSequences((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleRun = useCallback(
    (seq: Sequence) => {
      if (seq.params && seq.params.length > 0) {
        setParamModal(seq);
        setParamEntries({});
        return;
      }
      const messages = seq.steps.map((s) => s.message);
      onRun(messages);
      onClose();
    },
    [onRun, onClose],
  );

  const handleParamRun = useCallback(() => {
    if (!paramModal) return;
    const messages = paramModal.steps.map((s) => {
      let msg = s.message;
      for (const [key, val] of Object.entries(paramEntries)) {
        msg = msg.replace(new RegExp(`\\{${key}\\}`, "g"), val);
      }
      return msg;
    });
    onRun(messages);
    setParamModal(null);
    onClose();
  }, [paramModal, paramEntries, onRun, onClose]);

  const addStep = () =>
    setNewSteps((prev) => [...prev, { message: "", waitForDone: true }]);

  const removeStep = (idx: number) =>
    setNewSteps((prev) => prev.filter((_, i) => i !== idx));

  const updateStep = (idx: number, msg: string) =>
    setNewSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, message: msg } : s)),
    );

  return (
    <>
      <Drawer
        title={
          <Flex justify="space-between" align="center" style={{ width: "100%" }}>
            <Typography.Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {t("title")}
            </Typography.Text>
            <Button size="small" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t("create")}
            </Button>
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
        {sequences.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("empty")}
            style={{ marginTop: 60 }}
          />
        ) : (
          <Flex vertical gap={8}>
            {sequences.map((seq) => (
              <div key={seq.id} className="template-card">
                <Flex justify="space-between" align="center">
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {seq.name}
                  </Typography.Text>
                  <Tag style={{ margin: 0, fontSize: 11 }}>
                    {t("stepCount", { count: seq.steps.length })}
                  </Tag>
                </Flex>
                <Steps
                  direction="vertical"
                  size="small"
                  current={-1}
                  style={{ marginTop: 8 }}
                  items={seq.steps.map((s, i) => ({
                    title: (
                      <Typography.Text
                        style={{ fontSize: 12 }}
                        ellipsis
                      >
                        {s.message}
                      </Typography.Text>
                    ),
                    key: i,
                  }))}
                />
                <Flex gap={4} style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handleRun(seq)}
                  >
                    {t("run")}
                  </Button>
                  <Popconfirm
                    title={t("deleteConfirm")}
                    onConfirm={() => handleDelete(seq.id)}
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
        title={t("createSequence")}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText={t("save")}
        okButtonProps={{ disabled: !newName.trim() || newSteps.every((s) => !s.message.trim()) }}
        destroyOnHidden
        width={480}
      >
        <Flex vertical gap={12}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
          {newSteps.map((step, i) => (
            <Flex key={i} gap={8} align="start">
              <Tag style={{ margin: 0, flexShrink: 0, marginTop: 4 }}>{i + 1}</Tag>
              <Input.TextArea
                value={step.message}
                onChange={(e) => updateStep(i, e.target.value)}
                placeholder={t("stepPlaceholder")}
                rows={1}
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ flex: 1 }}
              />
              {newSteps.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeStep(i)}
                  style={{ marginTop: 2 }}
                />
              )}
            </Flex>
          ))}
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addStep}>
            {t("addStep")}
          </Button>
        </Flex>
      </Modal>

      <Modal
        title={t("fillParams")}
        open={!!paramModal}
        onCancel={() => setParamModal(null)}
        onOk={handleParamRun}
        okText={t("run")}
        destroyOnHidden
      >
        {paramModal && (
          <Flex vertical gap={12}>
            {(paramModal.params ?? []).map((p) => (
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
