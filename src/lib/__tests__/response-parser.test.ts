import { describe, it, expect } from "vitest";
import { parseResponse } from "@/lib/response-parser";

describe("parseResponse", () => {
  it("returns a single markdown segment for plain markdown", () => {
    const segments = parseResponse("Hello **world**\n\nParagraph.");
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      type: "markdown",
      content: "Hello **world**\n\nParagraph.",
    });
  });

  it("detects markdown table (header + separator + rows) as interactive-table with correct TableData", () => {
    const md = [
      "| Name | Qty |",
      "| --- | --- |",
      "| Apple | 2 |",
      "| Pear | 1 |",
    ].join("\n");
    const segments = parseResponse(md);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("interactive-table");
    expect(segments[0].table).toEqual({
      headers: ["Name", "Qty"],
      rows: [
        ["Apple", "2"],
        ["Pear", "1"],
      ],
    });
    expect(segments[0].content).toBe(md);
  });

  it("detects plan-review with ## 执行计划 and 2+ numbered steps", () => {
    const content = [
      "## 执行计划",
      "1. 只读查询当前配置",
      "2. 更新广告组状态",
      "请确认是否执行",
    ].join("\n");
    const segments = parseResponse(content);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("plan-review");
    expect(segments[0].plan?.title).toContain("执行计划");
    expect(segments[0].plan?.steps).toHaveLength(2);
    expect(segments[0].plan?.steps[0]).toMatchObject({
      index: 1,
      type: "read",
      hasBudgetRisk: false,
    });
    expect(segments[0].plan?.steps[1]).toMatchObject({
      index: 2,
      type: "write",
      hasBudgetRisk: false,
    });
    expect(segments[0].plan?.confirmText).toContain("确认");
  });

  it("tags plan steps as read / write / unknown correctly", () => {
    const content = [
      "### Action plan",
      "1. 只读查询数据",
      "2. 删除旧素材",
      "3. 同步状态到下游",
    ].join("\n");
    const plan = parseResponse(content)[0].plan;
    expect(plan?.steps[0].type).toBe("read");
    expect(plan?.steps[1].type).toBe("write");
    expect(plan?.steps[2].type).toBe("write");
  });

  it("detects budget risk in plan steps and collects warnings", () => {
    const content = [
      "## 变更计划",
      "1. 调整 campaign 日预算",
      "2. 检查日志",
    ].join("\n");
    const plan = parseResponse(content)[0].plan;
    expect(plan?.steps[0].hasBudgetRisk).toBe(true);
    expect(plan?.warnings.some((w) => /预算|budget/i.test(w))).toBe(true);
  });

  it("detects error-report with error heading and bullet fields", () => {
    const content = [
      "## 操作失败",
      "- **失败步骤**: 更新出价",
      "- **影响范围**: 单个广告组",
      "- **原因**: 权限不足",
      "- **恢复建议**: 重试",
    ].join("\n");
    const segments = parseResponse(content);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("error-report");
    const err = segments[0].error;
    expect(err?.title).toContain("操作失败");
    expect(err?.recovery).toBe("重试");
    const labels = err?.fields.map((f) => f.label) ?? [];
    expect(labels.some((l) => /失败步骤/i.test(l))).toBe(true);
    expect(labels.some((l) => /影响/i.test(l))).toBe(true);
  });

  it("splits mixed markdown + table + markdown into three segments", () => {
    const content = [
      "Intro line",
      "",
      "| A | B |",
      "| --- | --- |",
      "| 1 | 2 |",
      "",
      "Outro line",
    ].join("\n");
    const segments = parseResponse(content);
    expect(segments).toHaveLength(3);
    expect(segments[0].type).toBe("markdown");
    expect(segments[0].content).toContain("Intro");
    expect(segments[1].type).toBe("interactive-table");
    expect(segments[1].table?.headers).toEqual(["A", "B"]);
    expect(segments[2].type).toBe("markdown");
    expect(segments[2].content).toContain("Outro");
  });

  it("falls back to markdown when table has only header and separator", () => {
    const content = ["| H1 | H2 |", "| --- | --- |"].join("\n");
    const segments = parseResponse(content);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("markdown");
    expect(segments[0].content).toContain("| H1 | H2 |");
  });

  it("returns markdown when plan has only one numbered step", () => {
    const content = ["## 执行计划", "1. 仅一步"].join("\n");
    const segments = parseResponse(content);
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe("markdown");
  });

  it("returns markdown when error report matches fewer than two known fields", () => {
    const content = [
      "## 执行失败",
      "- **失败步骤**: 某步",
      "- **备注**: 其他",
    ].join("\n");
    const segments = parseResponse(content);
    expect(segments.every((s) => s.type === "markdown")).toBe(true);
  });
});
