"use client";

import { useState, useCallback } from "react";
import {
  Button,
  Table,
  Tag,
  Typography,
  Alert,
  Popover,
  Tooltip,
  Flex,
  Badge,
} from "antd";
import { ReloadOutlined, ToolOutlined } from "@ant-design/icons";
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
      setSkills(list);
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

  const eligibleCount = skills.filter(
    (s) => s.status?.toLowerCase() === "eligible",
  ).length;

  const columns = [
    {
      title: t("name"),
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <Typography.Text code style={{ fontSize: 12 }}>
          {name || "-"}
        </Typography.Text>
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
      <Flex
        justify="space-between"
        align="center"
        style={{ marginBottom: 12 }}
      >
        <Typography.Text strong style={{ fontSize: 14 }}>
          {t("title")}
        </Typography.Text>
        <Button
          size="small"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={refresh}
          aria-label={t("refreshStatus")}
        >
          {t("refresh")}
        </Button>
      </Flex>

      <Flex gap={8} style={{ marginBottom: 12 }}>
        <StatCard label={t("version")} value={activeVersion} />
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

      {!skills.length && !error && (
        <Typography.Text
          style={{ fontSize: 12, color: "var(--text-muted)" }}
        >
          {t("clickRefresh")}
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
      onOpenChange={setOpen}
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
