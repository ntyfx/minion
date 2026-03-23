"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useToggle, useMemoizedFn, useMount } from "ahooks";
import { Modal, Tooltip, Typography, Flex, Empty } from "antd";
import { BarChartOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";

// Lazy load the chart component to reduce initial bundle size
const Column = dynamic(
  () => import("@ant-design/charts").then((mod) => mod.Column),
  { ssr: false, loading: () => <div style={{ height: 160 }} /> }
);
import { useAppLocale } from "@/lib/locale";
import { formatTokenCount, lightenColor, getTokenUsage, isSSEChunkPayload } from "@/lib/utils";
import type { Session } from "@/types/chat";

interface DailyRecord {
  date: string;
  type: string;
  tokens: number;
}

function resolveColor(varName: string): string {
  if (typeof document === "undefined") return "#888";
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#888";
}

export function getMonthRange(offset: number): { start: number; end: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + offset;
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start: first.getTime(), end: last.getTime() };
}

export function aggregateByMonth(
  sessions: Session[],
  monthOffset: number,
  labels: { prompt: string; completion: string },
): { records: DailyRecord[]; totalPrompt: number; totalCompletion: number } {
  const { start, end } = getMonthRange(monthOffset);

  const dayMap = new Map<string, { prompt: number; completion: number }>();

  for (const session of sessions) {
    for (const evt of session.activity) {
      if (evt.type !== "token_usage" || evt.timestamp < start || evt.timestamp > end) continue;
      if (!isSSEChunkPayload(evt.payload)) continue;
      const usage = getTokenUsage(evt.payload);
      const key = new Date(evt.timestamp).toLocaleDateString("en-CA");
      const entry = dayMap.get(key) ?? { prompt: 0, completion: 0 };
      entry.prompt += usage.prompt_tokens;
      entry.completion += usage.completion_tokens;
      dayMap.set(key, entry);
    }
  }

  const firstDay = new Date(start);
  const lastDay = new Date(end);
  const allDates: string[] = [];
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    allDates.push(d.toLocaleDateString("en-CA"));
  }

  const records: DailyRecord[] = [];
  let totalPrompt = 0;
  let totalCompletion = 0;

  for (const date of allDates) {
    const entry = dayMap.get(date) ?? { prompt: 0, completion: 0 };
    totalPrompt += entry.prompt;
    totalCompletion += entry.completion;
    records.push({ date, type: labels.prompt, tokens: entry.prompt });
    records.push({ date, type: labels.completion, tokens: entry.completion });
  }

  return { records, totalPrompt, totalCompletion };
}


function RatioBar({ prompt, completion }: { prompt: number; completion: number }) {
  const total = prompt + completion;
  if (total === 0) return null;
  const promptPct = (prompt / total) * 100;

  return (
    <div
      style={{
        height: 6,
        borderRadius: 3,
        background: "var(--bg-muted)",
        overflow: "hidden",
        display: "flex",
      }}
    >
      <div
        style={{
          width: `${promptPct}%`,
          background: "var(--accent)",
          borderRadius: promptPct >= 100 ? 3 : "3px 0 0 3px",
          transition: "width 0.3s ease",
        }}
      />
      <div
        style={{
          flex: 1,
          background: "var(--info)",
          borderRadius: promptPct <= 0 ? 3 : "0 3px 3px 0",
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}

function HeroSection({
  total,
  prompt,
  completion,
  promptLabel,
  completionLabel,
}: {
  total: number;
  prompt: number;
  completion: number;
  promptLabel: string;
  completionLabel: string;
}) {
  return (
    <div
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px 20px 16px",
      }}
    >
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg, var(--accent), var(--info), #a855f7, var(--accent))",
          backgroundSize: "200% 200%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {formatTokenCount(total)}
      </div>

      <div style={{ margin: "14px 0 12px" }}>
        <RatioBar prompt={prompt} completion={completion} />
      </div>

      <Flex align="center" gap={16}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              flexShrink: 0,
            }}
          />
          {promptLabel}
          <span
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {formatTokenCount(prompt)}
          </span>
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "var(--text-secondary)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "var(--info)",
              flexShrink: 0,
            }}
          />
          {completionLabel}
          <span
            style={{
              fontFamily: "var(--font-mono), ui-monospace, monospace",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {formatTokenCount(completion)}
          </span>
        </span>
      </Flex>
    </div>
  );
}

function TokenChart({ records, promptLabel }: { records: DailyRecord[]; promptLabel: string }) {
  const [colors, setColors] = useState<[string, string]>(["#10b981", "#3b82f6"]);

  useMount(() => {
    const accent = resolveColor("--accent");
    const info = resolveColor("--info");
    // Only update if colors are different from defaults to avoid unnecessary re-render
    if (accent !== colors[0] || info !== colors[1]) {
      setColors([accent, info]);
    }
  });

  const config = useMemo(
    () => ({
      data: records,
      xField: "date",
      yField: "tokens",
      colorField: "type",
      stack: true,
      axis: {
        x: false as const,
        y: false as const,
      },
      legend: false as const,
      style: {
        fill: (d: DailyRecord) => {
          const [accent, info] = colors;
          if (d.type === promptLabel) {
            return `l(270) 0:${lightenColor(accent)} 1:${accent}`;
          }
          return info;
        },
        radiusTopLeft: 3,
        radiusTopRight: 3,
        maxWidth: 28,
        minWidth: 6,
      },
      tooltip: {
        title: "date",
        items: [
          {
            field: "tokens",
            valueFormatter: (v: number) => formatTokenCount(v),
          },
        ],
      },
      interaction: {
        elementHighlightByX: false,
        elementHighlight: false,
        tooltip: {
          css: {
            ".g2-tooltip": { padding: "0 !important", background: "transparent !important", "box-shadow": "none !important" },
            ".g2-tooltip-title": { display: "none !important" },
            ".g2-tooltip-list": { display: "none !important" },
          },
          render: (_: unknown, { title, items }: { title: string; items: Array<{ name: string; value: string }> }) => {
            const dt = new Date(title);
            const dateStr = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
            const [accent, info] = colors;
            return `<div style="padding:6px 10px;font-size:13px;line-height:1.5;background:var(--bg-elevated);border:1px solid var(--border);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08)">` +
              `<div style="color:var(--text-secondary);margin-bottom:2px">${dateStr}</div>` +
              items.map((item) => {
                const dotColor = item.name === promptLabel ? accent : info;
                return `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px">` +
                  `<span style="display:inline-flex;align-items:center;gap:5px">` +
                  `<span style="width:7px;height:7px;border-radius:50%;background:${dotColor}"></span>` +
                  `<span style="color:var(--text-secondary)">${item.name}</span>` +
                  `</span>` +
                  `<span style="font-weight:600;font-variant-numeric:tabular-nums;color:var(--text-primary)">${item.value}</span>` +
                  `</div>`;
              }).join("") +
              `</div>`;
          },
        },
      },
      height: 160,
      autoFit: true,
      paddingTop: 8,
      paddingRight: 4,
      paddingBottom: 0,
      paddingLeft: 4,
      marginBottom: -4,
    }),
    [records, colors, promptLabel],
  );

  return <Column {...config} />;
}

export function formatMonthLabel(offset: number, locale: string): string {
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return target.toLocaleDateString(locale, { year: "numeric", month: "long" });
}

function TokenReportContent({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("tokenReport");
  const { locale } = useAppLocale();
  const [monthOffset, setMonthOffset] = useState(0);

  const promptLabel = t("promptTokens");
  const completionLabel = t("completionTokens");

  const { records, totalPrompt, totalCompletion } = useMemo(
    () => aggregateByMonth(sessions, monthOffset, { prompt: promptLabel, completion: completionLabel }),
    [sessions, monthOffset, promptLabel, completionLabel],
  );

  const goPrev = useMemoizedFn(() => setMonthOffset((o) => o - 1));
  const goNext = useMemoizedFn(() => setMonthOffset((o) => o + 1));

  const totalTokens = totalPrompt + totalCompletion;
  const hasData = totalTokens > 0;

  return (
    <div>
      <Flex justify="space-between" align="center" style={{ marginBottom: 14 }}>
        <Typography.Text style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
          {t("totalTokens")}
        </Typography.Text>
        <Flex align="center" gap={8}>
          <button
            className="icon-button"
            onClick={goPrev}
            aria-label={t("previousMonth")}
            style={{ fontSize: 12, width: 26, height: 26 }}
          >
            <LeftOutlined />
          </button>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              minWidth: 100,
              textAlign: "center",
              userSelect: "none",
            }}
          >
            {formatMonthLabel(monthOffset, locale)}
          </span>
          <button
            className="icon-button"
            onClick={goNext}
            disabled={monthOffset >= 0}
            aria-label={t("nextMonth")}
            style={{ fontSize: 12, width: 26, height: 26 }}
          >
            <RightOutlined />
          </button>
        </Flex>
      </Flex>

      <HeroSection
        total={totalTokens}
        prompt={totalPrompt}
        completion={totalCompletion}
        promptLabel={promptLabel}
        completionLabel={completionLabel}
      />

      <Typography.Text
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--text-secondary)",
          margin: "18px 0 10px",
        }}
      >
        {t("dailyUsage")}
      </Typography.Text>

      {hasData ? (
        <div
          style={{
            borderRadius: 10,
            padding: "8px 10px 0",
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            overflow: "hidden",
          }}
        >
          <TokenChart records={records} promptLabel={promptLabel} />
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "40px 0",
            background: "var(--bg-surface)",
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Typography.Text style={{ color: "var(--text-muted)", fontSize: 13 }}>
                {t("noData")}
              </Typography.Text>
            }
          />
        </div>
      )}
    </div>
  );
}

export function TokenReportToggle({ sessions }: { sessions: Session[] }) {
  const t = useTranslations("tokenReport");
  const [open, { toggle }] = useToggle(false);

  return (
    <>
      <Tooltip title={t("title")}>
        <button
          className="icon-button"
          onClick={toggle}
          aria-label={t("openReport")}
        >
          <BarChartOutlined />
        </button>
      </Tooltip>
      <Modal
        title={t("title")}
        open={open}
        onCancel={toggle}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {open && <TokenReportContent sessions={sessions} />}
      </Modal>
    </>
  );
}

export default TokenReportToggle;
