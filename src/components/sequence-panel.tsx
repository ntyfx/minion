"use client";

import { memo, useState, useCallback, useEffect, useRef } from "react";
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
  Tooltip,
  Progress,
  Switch,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  OrderedListOutlined,
  MinusCircleOutlined,
  EditOutlined,
  StopOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import {
  loadSequences,
  saveSequence,
  deleteSequence,
  createSequenceId,
  updateSequenceUseCount,
  saveExecutionRecord,
  getExecutionRecords,
} from "@/lib/sequence-db";
import type { Sequence, SequenceStep, SequenceExecutionRecord } from "@/lib/sequence-db";

type ExecutionStatus = "idle" | "running" | "paused" | "completed" | "error";

interface ExecutionState {
  status: ExecutionStatus;
  currentStep: number;
  totalSteps: number;
  error?: string;
}

interface StepParamsModalState {
  stepIndex: number;
  stepMessage: string;
  paramKeys: string[];
}

interface SequencePanelProps {
  open: boolean;
  onClose: () => void;
  isStreaming: boolean;
  onSendMessage: (message: string) => void;
  onStopStreaming: () => void;
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

function extractParamsFromStep(stepMessage: string): string[] {
  const paramMatches = stepMessage.match(/\{([^}]+)\}/g) ?? [];
  return [...new Set(paramMatches.map((m) => m.slice(1, -1)))];
}

function resolveStepMessage(message: string, params: Record<string, string>): string {
  let result = message;
  for (const [key, val] of Object.entries(params)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\{${escapedKey}\\}`, "g"), val);
  }
  return result;
}

export default memo(function SequencePanel({
  open,
  onClose,
  isStreaming,
  onSendMessage,
  onStopStreaming,
}: SequencePanelProps) {
  const t = useTranslations("sequences");
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSteps, setNewSteps] = useState<SequenceStep[]>([
    { message: "", waitForDone: true },
  ]);

  const [editingSequence, setEditingSequence] = useState<Sequence | null>(null);
  const [editName, setEditName] = useState("");
  const [editSteps, setEditSteps] = useState<SequenceStep[]>([]);

  const [executionState, setExecutionState] = useState<ExecutionState>({
    status: "idle",
    currentStep: 0,
    totalSteps: 0,
  });
  const [runningSequenceId, setRunningSequenceId] = useState<string | null>(null);

  const [stepParamsModal, setStepParamsModal] = useState<StepParamsModalState | null>(null);
  const [stepParamEntries, setStepParamEntries] = useState<Record<string, string>>({});

  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [executionRecords, setExecutionRecords] = useState<SequenceExecutionRecord[]>([]);
  const currentExecutionRef = useRef<SequenceExecutionRecord | null>(null);

  const prevStreamingRef = useRef(isStreaming);
  const executionStateRef = useRef(executionState);
  const currentSequenceRef = useRef<Sequence | null>(null);
  const runningSequenceIdRef = useRef<string | null>(null);

  useEffect(() => {
    executionStateRef.current = executionState;
  }, [executionState]);

  useEffect(() => {
    runningSequenceIdRef.current = runningSequenceId;
  }, [runningSequenceId]);

  const loadRecords = useCallback(async () => {
    const list = await loadSequences();
    setSequences(list.sort((a, b) => b.useCount - a.useCount));
  }, []);

  const loadExecutionRecords = useCallback(async () => {
    const records = await getExecutionRecords();
    setExecutionRecords(records);
  }, []);

  useEffect(() => {
    if (open) {
      loadRecords();
      loadExecutionRecords();
    }
  }, [open, loadRecords, loadExecutionRecords]);

  const processNextStep = useCallback(() => {
    const state = executionStateRef.current;
    const sequence = currentSequenceRef.current;
    const seqId = runningSequenceIdRef.current;

    if (!sequence || state.status !== "running") {
      return;
    }

    const nextStepIndex = state.currentStep + 1;

    if (nextStepIndex >= sequence.steps.length) {
      if (currentExecutionRef.current) {
        currentExecutionRef.current.endTime = Date.now();
        currentExecutionRef.current.status = 'success';
        saveExecutionRecord(currentExecutionRef.current);
        loadExecutionRecords();
      }

      setExecutionState({
        status: "completed",
        currentStep: nextStepIndex,
        totalSteps: sequence.steps.length,
      });
      if (seqId) {
        updateSequenceUseCount(seqId, 1).then(() => {
          setSequences((prev) =>
            prev.map((s) =>
              s.id === seqId ? { ...s, useCount: s.useCount + 1 } : s
            )
          );
        });
      }
      setRunningSequenceId(null);
      currentSequenceRef.current = null;
      currentExecutionRef.current = null;
      return;
    }

    const nextStep = sequence.steps[nextStepIndex];
    const paramKeys = extractParamsFromStep(nextStep.message);

    if (paramKeys.length > 0) {
      setStepParamsModal({
        stepIndex: nextStepIndex,
        stepMessage: nextStep.message,
        paramKeys,
      });
      setStepParamEntries({});
    } else {
      if (currentExecutionRef.current) {
        currentExecutionRef.current.steps.push({
          stepIndex: nextStepIndex,
          message: nextStep.message,
          executedAt: Date.now()
        });
      }
      
      setExecutionState((prev) => ({
        ...prev,
        currentStep: nextStepIndex,
      }));
      onSendMessage(nextStep.message);

      if (!nextStep.waitForDone) {
        setTimeout(() => processNextStep(), 100);
      }
    }
  }, [onSendMessage, loadExecutionRecords]);

  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    const isNowIdle = !isStreaming && wasStreaming;

    if (isNowIdle && executionStateRef.current.status === "running") {
      processNextStep();
    }

    prevStreamingRef.current = isStreaming;
  }, [isStreaming, processNextStep]);

  const handleCreate = useCallback(async () => {
    const steps = newSteps.filter((s) => s.message.trim());
    if (!newName.trim() || steps.length === 0) return;
    const allText = steps.map((s) => s.message).join(" ");
    const paramMatches = allText.match(/\{([^}]+)\}/g) ?? [];
    const params = [...new Set(paramMatches.map((m) => m.slice(1, -1)))].map(
      (key) => ({ key, label: key })
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

  const startEdit = useCallback((seq: Sequence) => {
    setEditingSequence(seq);
    setEditName(seq.name);
    setEditSteps([...seq.steps]);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingSequence(null);
    setEditName("");
    setEditSteps([]);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingSequence || !editName.trim()) return;
    const steps = editSteps.filter((s) => s.message.trim());
    if (steps.length === 0) return;

    const allText = steps.map((s) => s.message).join(" ");
    const paramMatches = allText.match(/\{([^}]+)\}/g) ?? [];
    const params = [...new Set(paramMatches.map((m) => m.slice(1, -1)))].map(
      (key) => ({ key, label: key })
    );

    const updatedSeq: Sequence = {
      ...editingSequence,
      name: editName.trim(),
      steps,
      params: params.length > 0 ? params : undefined,
      updatedAt: Date.now(),
    };
    await saveSequence(updatedSeq);
    setSequences((prev) =>
      prev.map((s) => (s.id === editingSequence.id ? updatedSeq : s))
    );
    cancelEdit();
  }, [editingSequence, editName, editSteps, cancelEdit]);

  const updateEditStep = useCallback((idx: number, msg: string) => {
    setEditSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, message: msg } : s))
    );
  }, []);

  const toggleEditStepWaitForDone = useCallback((idx: number) => {
    setEditSteps((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, waitForDone: !s.waitForDone } : s
      )
    );
  }, []);

  const removeEditStep = useCallback((idx: number) => {
    setEditSteps((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addEditStep = useCallback(() => {
    setEditSteps((prev) => [...prev, { message: "", waitForDone: true }]);
  }, []);

  const handleSequenceRun = useCallback(async (seq: Sequence) => {
    if (seq.steps.length === 0) return;

    const executionId = createSequenceId();
    const executionRecord: SequenceExecutionRecord = {
      id: executionId,
      sequenceId: seq.id,
      sequenceName: seq.name,
      startTime: Date.now(),
      status: 'success',
      steps: []
    };

    setRunningSequenceId(seq.id);
    currentSequenceRef.current = seq;
    currentExecutionRef.current = executionRecord;

    setExecutionState({
      status: "running",
      currentStep: 0,
      totalSteps: seq.steps.length,
    });

    const firstStep = seq.steps[0];
    const paramKeys = extractParamsFromStep(firstStep.message);

    if (paramKeys.length > 0) {
      setStepParamsModal({
        stepIndex: 0,
        stepMessage: firstStep.message,
        paramKeys,
      });
      setStepParamEntries({});
    } else {
      if (currentExecutionRef.current) {
        currentExecutionRef.current.steps.push({
          stepIndex: 0,
          message: firstStep.message,
          executedAt: Date.now()
        });
      }
      onSendMessage(firstStep.message);

      if (!firstStep.waitForDone) {
        setTimeout(() => processNextStep(), 100);
      }
    }
  }, [onSendMessage, processNextStep]);

  const handleStepParamsConfirm = useCallback(() => {
    if (!stepParamsModal) return;

    const sequence = currentSequenceRef.current;
    if (!sequence) return;

    const step = sequence.steps[stepParamsModal.stepIndex];
    const resolvedMessage = resolveStepMessage(step.message, stepParamEntries);

    if (currentExecutionRef.current) {
      currentExecutionRef.current.steps.push({
        stepIndex: stepParamsModal.stepIndex,
        message: step.message,
        params: { ...stepParamEntries },
        executedAt: Date.now()
      });
    }

    setStepParamsModal(null);
    setStepParamEntries({});

    setExecutionState((prev) => ({
      ...prev,
      currentStep: stepParamsModal.stepIndex,
    }));

    onSendMessage(resolvedMessage);

    if (!step.waitForDone) {
      setTimeout(() => processNextStep(), 100);
    }
  }, [stepParamsModal, stepParamEntries, onSendMessage, processNextStep]);

  const handleCancelExecution = useCallback(() => {
    if (executionState.status === "running" && isStreaming) {
      onStopStreaming();
    }
    
    if (currentExecutionRef.current && executionState.status === "running") {
      currentExecutionRef.current.endTime = Date.now();
      currentExecutionRef.current.status = 'interrupted';
      saveExecutionRecord(currentExecutionRef.current);
      loadExecutionRecords();
    }

    setExecutionState({
      status: "idle",
      currentStep: 0,
      totalSteps: 0,
    });
    setRunningSequenceId(null);
    currentSequenceRef.current = null;
    currentExecutionRef.current = null;
    setStepParamsModal(null);
    setStepParamEntries({});
  }, [executionState.status, isStreaming, onStopStreaming, loadExecutionRecords]);

  const addStep = () =>
    setNewSteps((prev) => [...prev, { message: "", waitForDone: true }]);

  const removeStep = (idx: number) =>
    setNewSteps((prev) => prev.filter((_, i) => i !== idx));

  const updateStep = (idx: number, msg: string) =>
    setNewSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, message: msg } : s))
    );

  const toggleStepWaitForDone = (idx: number) =>
    setNewSteps((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, waitForDone: !s.waitForDone } : s
      )
    );

  const progressPercent =
    executionState.totalSteps > 0
      ? Math.round((executionState.currentStep / executionState.totalSteps) * 100)
      : 0;

  return (
    <>
      <Drawer
        title={
          <Flex justify="space-between" align="center" style={{ width: "100%" }}>
            <Typography.Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              {t("title")}
            </Typography.Text>
            <Flex gap={8}>
              <Button 
                size="small" 
                icon={<ClockCircleOutlined />} 
                onClick={() => setHistoryDrawerOpen(true)}
              >
                历史
              </Button>
              <Button size="small" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                {t("create")}
              </Button>
            </Flex>
          </Flex>
        }
        open={open}
        onClose={onClose}
        placement="right"
        styles={{
          wrapper: { width: 420 },
          header: { padding: "10px 16px" },
          body: { padding: "12px 16px" },
        }}
      >
        {executionState.status !== "idle" && (
          <div style={{ marginBottom: 16, padding: 12, background: "var(--bg-elevated)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <Flex vertical gap={8}>
              <Flex justify="space-between" align="center">
                <Typography.Text style={{ fontSize: 13 }}>
                  {executionState.status === "running" && t("executing")}
                  {executionState.status === "completed" && t("completed")}
                  {executionState.status === "error" && t("error")}
                </Typography.Text>
                <Tag color={executionState.status === "completed" ? "success" : executionState.status === "error" ? "error" : "processing"}>
                  {executionState.currentStep + 1} / {executionState.totalSteps}
                </Tag>
              </Flex>
              <Progress
                percent={progressPercent}
                size="small"
                status={executionState.status === "completed" ? "success" : executionState.status === "error" ? "exception" : "active"}
                strokeColor="var(--accent)"
              />
              {executionState.error && (
                <Typography.Text type="danger" style={{ fontSize: 12 }}>
                  {executionState.error}
                </Typography.Text>
              )}
              {(executionState.status === "running" || executionState.status === "paused") && (
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={handleCancelExecution}
                >
                  {t("stop")}
                </Button>
              )}
            </Flex>
          </div>
        )}

        {sequences.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t("empty")}
            style={{ marginTop: 60 }}
          />
        ) : (
          <Flex vertical gap={10}>
            {sequences.map((seq) => (
              <div key={seq.id} className="sequence-card">
                <div className="sequence-card-header">
                  <div className="sequence-card-title">
                    <Typography.Text strong style={{ fontSize: 14 }}>
                      {seq.name}
                    </Typography.Text>
                    <Flex gap={4} style={{ marginTop: 6 }}>
                      <Tag style={{ margin: 0, fontSize: 11 }} icon={<OrderedListOutlined />}>
                        {t("stepCount", { count: seq.steps.length })}
                      </Tag>
                      {seq.params && seq.params.length > 0 && (
                        <Tag style={{ margin: 0, fontSize: 11 }} color="processing">
                          {seq.params.length} {t("params")}
                        </Tag>
                      )}
                      {seq.useCount > 0 && (
                        <Tag style={{ margin: 0, fontSize: 11 }} color="blue">
                          {t("usedCount", { count: seq.useCount })}
                        </Tag>
                      )}
                    </Flex>
                  </div>
                  <div className="sequence-card-actions">
                    <Tooltip title={t("run")}>
                      <Button
                        type="primary"
                        size="small"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleSequenceRun(seq)}
                        disabled={executionState.status === "running"}
                        style={{ borderRadius: 6 }}
                      />
                    </Tooltip>
                    <Tooltip title={t("edit")}>
                      <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => startEdit(seq)}
                        disabled={executionState.status === "running"}
                        style={{ borderRadius: 6 }}
                      />
                    </Tooltip>
                    <Popconfirm
                      title={t("deleteConfirm")}
                      onConfirm={() => handleDelete(seq.id)}
                      okText={t("yes")}
                      cancelText={t("no")}
                    >
                      <Tooltip title={t("delete")}>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ borderRadius: 6 }}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </div>

                <div className="sequence-card-steps">
                  {seq.steps.slice(0, 3).map((s, i) => (
                    <div key={i} className="sequence-step">
                      <div className="sequence-step-number">{i + 1}</div>
                      <div className="sequence-step-content">
                        <Typography.Text style={{ fontSize: 12 }} ellipsis>
                          {s.message}
                        </Typography.Text>
                        {s.waitForDone && (
                          <Tag style={{ margin: 0, fontSize: 10, marginLeft: 6 }} color="green">
                            {t("waitForDone")}
                          </Tag>
                        )}
                      </div>
                    </div>
                  ))}
                  {seq.steps.length > 3 && (
                    <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 28 }}>
                      +{seq.steps.length - 3} {t("moreSteps")}
                    </Typography.Text>
                  )}
                </div>

                {seq.params && seq.params.length > 0 && (
                  <div className="sequence-card-params">
                    <div className="sequence-card-params-label">
                      <span className="sequence-card-params-label-icon">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.25 7.5L4.5 11.25L8.25 15M15.75 7.5L19.5 11.25L15.75 15" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                      {t("params")}
                    </div>
                    <div className="sequence-card-params-tags">
                      {seq.params.map((p) => (
                        <div key={p.key} className="sequence-card-param-tag">
                          <span className="sequence-card-param-tag-braces">{`{`}</span>
                          <span className="sequence-card-param-tag-key">{p.key}</span>
                          <span className="sequence-card-param-tag-braces">{`}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Flex>
        )}
      </Drawer>

      <Drawer
        title={
          <Flex justify="space-between" align="center" style={{ width: "100%" }}>
            <Typography.Text strong style={{ fontSize: 14, color: "var(--text-primary)" }}>
              执行历史
            </Typography.Text>
            <Button 
              size="small" 
              icon={<ReloadOutlined />}
              onClick={loadExecutionRecords}
            />
          </Flex>
        }
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        placement="right"
        styles={{
          wrapper: { width: 420 },
          header: { padding: "10px 16px" },
          body: { padding: "12px 16px" },
        }}
      >
        <Flex vertical gap={8} style={{ overflow: 'auto', flex: 1 }}>
          {executionRecords.length === 0 ? (
            <Empty description="暂无执行记录" style={{ marginTop: 40 }} />
          ) : (
            executionRecords.map(record => (
              <div key={record.id} className="template-card">
                <Flex justify="space-between" align="center">
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {record.sequenceName}
                  </Typography.Text>
                  <Tag color={
                    record.status === 'success' ? 'success' : 
                    record.status === 'error' ? 'error' : 'warning'
                  }>
                    {record.status === 'success' ? '成功' : record.status === 'error' ? '失败' : '中断'}
                  </Tag>
                </Flex>
                
                <Flex justify="space-between" style={{ marginTop: 4 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(record.startTime).toLocaleString()}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {record.steps.length} 步
                  </Typography.Text>
                </Flex>

                {record.steps.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    {record.steps.slice(0, 3).map((step, i) => (
                      <Typography.Text 
                        ellipsis 
                        style={{ fontSize: 12, display: 'block', marginBottom: 4 }} 
                        key={i}
                      >
                        {i + 1}. {step.message}
                      </Typography.Text>
                    ))}
                    {record.steps.length > 3 && (
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        +{record.steps.length - 3} 更多步骤
                      </Typography.Text>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </Flex>
      </Drawer>

      <Modal
        title={t("createSequence")}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText={t("save")}
        okButtonProps={{ disabled: !newName.trim() || newSteps.every((s) => !s.message.trim()) }}
        destroyOnHidden
        width={520}
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
              <Flex vertical gap={4} style={{ flex: 1 }}>
                <Input.TextArea
                  value={step.message}
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder={t("stepPlaceholder")}
                  rows={1}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  style={{ flex: 1 }}
                />
                <Flex align="center" gap={8}>
                  <Switch
                    size="small"
                    checked={step.waitForDone}
                    onChange={() => toggleStepWaitForDone(i)}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {t("waitForDone")}
                  </Typography.Text>
                </Flex>
              </Flex>
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
        title={t("editSequence")}
        open={!!editingSequence}
        onCancel={cancelEdit}
        onOk={handleSaveEdit}
        okText={t("save")}
        okButtonProps={{ disabled: !editName.trim() || editSteps.every((s) => !s.message.trim()) }}
        destroyOnHidden
        width={520}
      >
        <Flex vertical gap={12}>
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder={t("namePlaceholder")}
          />
          {editSteps.map((step, i) => (
            <Flex key={i} gap={8} align="start">
              <Tag style={{ margin: 0, flexShrink: 0, marginTop: 4 }}>{i + 1}</Tag>
              <Flex vertical gap={4} style={{ flex: 1 }}>
                <Input.TextArea
                  value={step.message}
                  onChange={(e) => updateEditStep(i, e.target.value)}
                  placeholder={t("stepPlaceholder")}
                  rows={1}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  style={{ flex: 1 }}
                />
                <Flex align="center" gap={8}>
                  <Switch
                    size="small"
                    checked={step.waitForDone}
                    onChange={() => toggleEditStepWaitForDone(i)}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {t("waitForDone")}
                  </Typography.Text>
                </Flex>
              </Flex>
              {editSteps.length > 1 && (
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeEditStep(i)}
                  style={{ marginTop: 2 }}
                />
              )}
            </Flex>
          ))}
          <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addEditStep}>
            {t("addStep")}
          </Button>
        </Flex>
      </Modal>

      <Modal
        title={`${t("fillParams")} - 第 ${(stepParamsModal?.stepIndex ?? 0) + 1} 步`}
        open={!!stepParamsModal}
        onCancel={() => {
          setStepParamsModal(null);
          setStepParamEntries({});
          handleCancelExecution();
        }}
        onOk={handleStepParamsConfirm}
        okText={t("run")}
        destroyOnHidden
      >
        {stepParamsModal && (
          <Flex vertical gap={12}>
            <Typography.Text type="secondary" style={{ fontSize: 12, padding: 8, background: 'var(--bg-secondary)', borderRadius: 6 }}>
              {stepParamsModal.stepMessage}
            </Typography.Text>
            {stepParamsModal.paramKeys.map((key) => (
              <div key={key}>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                  {key}
                </Typography.Text>
                <Input
                  value={stepParamEntries[key] ?? ""}
                  onChange={(e) =>
                    setStepParamEntries((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={`请输入 ${key}`}
                  autoFocus
                />
              </div>
            ))}
          </Flex>
        )}
      </Modal>
    </>
  );
});
