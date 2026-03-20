"use client";

import { memo, useMemo, useState, useCallback } from "react";
import { Table, Input, Button, Tooltip, Flex, message } from "antd";
import { DownloadOutlined, CopyOutlined, CheckOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { TableData } from "@/lib/response-parser";

interface InteractiveTableProps {
  table: TableData;
}

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) =>
    v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\n");
}

export const InteractiveTable = memo(function InteractiveTable({
  table,
}: InteractiveTableProps) {
  const t = useTranslations("richContent");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const filteredRows = useMemo(() => {
    if (!search.trim()) return table.rows;
    const q = search.toLowerCase();
    return table.rows.filter((row) =>
      row.some((cell) => cell.toLowerCase().includes(q)),
    );
  }, [table.rows, search]);

  const columns = useMemo(
    () =>
      table.headers.map((h, idx) => ({
        title: h,
        dataIndex: String(idx),
        key: String(idx),
        sorter: (a: Record<string, string>, b: Record<string, string>) =>
          (a[String(idx)] ?? "").localeCompare(b[String(idx)] ?? ""),
        ellipsis: true,
      })),
    [table.headers],
  );

  const dataSource = useMemo(
    () =>
      filteredRows.map((row, ri) => {
        const record: Record<string, string> = { key: String(ri) };
        row.forEach((cell, ci) => {
          record[String(ci)] = cell;
        });
        return record;
      }),
    [filteredRows],
  );

  const handleExport = useCallback(() => {
    const csv = toCsv(table.headers, table.rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "table-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [table]);

  const handleCopy = useCallback(async () => {
    const text = [table.headers.join("\t"), ...table.rows.map((r) => r.join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      messageApi.success(t("tableCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      messageApi.error("Copy failed");
    }
  }, [table, t, messageApi]);

  return (
    <div className="rich-table-wrapper">
      {contextHolder}
      <Flex
        justify="space-between"
        align="center"
        gap={8}
        className="rich-table-toolbar"
      >
        <Input
          placeholder={t("tableSearch")}
          size="small"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 200 }}
        />
        <Flex gap={4}>
          <span className="rich-table-count">
            {t("tableRows", { count: filteredRows.length })}
          </span>
          <Tooltip title={t("tableCopy")}>
            <Button
              size="small"
              type="text"
              icon={copied ? <CheckOutlined /> : <CopyOutlined />}
              onClick={handleCopy}
            />
          </Tooltip>
          <Tooltip title={t("tableExport")}>
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={handleExport}
            />
          </Tooltip>
        </Flex>
      </Flex>
      <Table
        columns={columns}
        dataSource={dataSource}
        size="small"
        pagination={dataSource.length > 10 ? { pageSize: 10, size: "small" } : false}
        scroll={{ x: "max-content" }}
        style={{ fontSize: 13 }}
      />
    </div>
  );
});
