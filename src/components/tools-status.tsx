"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Table,
  Tag,
  Typography,
  Alert,
  Popover,
  Tooltip,
  Flex,
  Badge,
} from "antd";
import { ToolOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import { fetchSkills } from "@/lib/sse-client";
import type { SkillItem } from "@/types/chat";

interface ToolsStatusProps {
  baseUrl: string;
  accessToken: string;
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        background: "var(--bg-muted)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          color: "var(--text-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function ToolsToggle({ baseUrl, accessToken }: ToolsStatusProps) {
  const t = useTranslations("tools");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [activeVersion, setActiveVersion] = useState("-");
  const [loadedAt, setLoadedAt] = useState("-");
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) {
      setError(t("noToken"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchSkills(baseUrl, accessToken);
      const list = Array.isArray(payload.skills) ? payload.skills : [];
      const withVersion = list.map((s) => ({
        ...s,
        active_version: payload.active_version || "-",
      }));
      setSkills(withVersion);
      setActiveVersion(payload.active_version || "-");
      setLoadedAt(payload.loaded_at || "-");
      if (!list.length) {
        setError(t("noSkills"));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [baseUrl, accessToken, t]);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (accessToken) refresh();
  }, [accessToken, refresh]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next) refresh();
    },
    [refresh],
  );

  const eligibleCount = skills.filter(
    (s) => s.status?.toLowerCase() === "eligible",
  ).length;

  const columns = [
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name: string, record: SkillItem) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Typography.Text>{name || "-"}</Typography.Text>
          {record.description ? (
            <Tooltip title={record.description} placement="top">
              <InfoCircleOutlined style={{ color: "var(--text-muted)", fontSize: 12 }} />
            </Tooltip>
          ) : null}
        </span>
      ),
    },
    {
      title: t("version"),
      dataIndex: "active_version",
      key: "active_version",
      width: 120,
      render: (active_version: string) => (
        <Typography.Text>{active_version || "-"}</Typography.Text>
      ),
    },
    {
      title: t("status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => {
        const s = (status || "unknown").toLowerCase();
        const color =
          s === "eligible"
            ? "success"
            : s === "ineligible"
              ? "error"
              : "warning";
        return <Tag color={color}>{status || t("unknown")}</Tag>;
      },
    },
  ];

  const content = (
    <div style={{ width: 400 }}>
      <Typography.Text strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
        {t("title")}
      </Typography.Text>

      <Flex gap={8} style={{ marginBottom: 12 }}>
        <StatCard label={t("loaded")} value={loadedAt} />
        <StatCard
          label={t("eligible")}
          value={`${eligibleCount} / ${skills.length}`}
        />
      </Flex>

      {error && (
        <Alert
          title={error}
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
        />
      )}

      {skills.length > 0 && (
        <Table
          className="tools-status-table"
          dataSource={skills.map((s, i) => ({ ...s, key: i }))}
          columns={columns}
          pagination={false}
          size="small"
          scroll={{ y: 240 }}
          style={{
            border: "1px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        />
      )}

      {!skills.length && !error && loading && (
        <Typography.Text
          style={{ fontSize: 12, color: "var(--text-muted)" }}
        >
          …
        </Typography.Text>
      )}
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={handleOpenChange}
      overlayStyle={{ maxWidth: 440 }}
    >
      <Tooltip title={t("title")}>
        <Badge
          count={skills.length > 0 ? eligibleCount : 0}
          size="small"
          offset={[-4, 4]}
          color="var(--accent)"
          showZero={false}
        >
          <button
            className="icon-button"
            aria-label={t("openStatus")}
          >
            <ToolOutlined />
          </button>
        </Badge>
      </Tooltip>
    </Popover>
  );
}

export default ToolsToggle;
