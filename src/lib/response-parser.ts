export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface PlanStep {
  index: number;
  label: string;
  type: "read" | "write" | "unknown";
  hasBudgetRisk: boolean;
}

export interface PlanData {
  title: string;
  steps: PlanStep[];
  warnings: string[];
  confirmText: string;
}

export interface ErrorReportData {
  title: string;
  fields: Array<{ label: string; value: string }>;
  recovery?: string;
}

export interface ContentSegment {
  type: "markdown" | "plan-review" | "interactive-table" | "error-report";
  content: string;
  table?: TableData;
  plan?: PlanData;
  error?: ErrorReportData;
}

function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith("|") && t.endsWith("|") && t.length > 2;
}

function isTableSeparator(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith("|") || !t.endsWith("|")) return false;
  const cells = t.slice(1, -1).split("|");
  return cells.length > 0 && cells.every((c) => /^\s*:?-{2,}:?\s*$/.test(c));
}

function parseTableBlock(lines: string[]): TableData | null {
  if (lines.length < 3) return null;
  const splitCells = (row: string) =>
    row
      .trim()
      .slice(1, -1)
      .split("|")
      .map((c) => c.trim());

  const headers = splitCells(lines[0]);
  if (headers.length === 0) return null;

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    rows.push(splitCells(lines[i]));
  }
  if (rows.length === 0) return null;
  return { headers, rows };
}

const PLAN_HEADING_RE =
  /^#{1,3}\s.*(?:执行计划|操作方案|变更计划|execution\s+plan|action\s+plan|write\s+plan|plan[- ]review)/i;
const PLAN_CONFIRM_RE =
  /(?:确认|approve|同意|执行|proceed|是否执行|请确认|等待确认|waiting for)/i;
const READ_TAG_RE = /\[?\s*read\s*]?|只读|查询/i;
const WRITE_TAG_RE =
  /\[?\s*write\s*]?|写操作|变更|创建|更新|删除|上传|同步|切换/i;
const BUDGET_RE = /预算|budget|出价|bid|资金|日预算|daily.*budget/i;

function detectPlanReview(content: string): PlanData | null {
  const lines = content.split("\n");
  let title = "";
  const steps: PlanStep[] = [];
  const warnings: string[] = [];
  let confirmText = "";

  let foundHeading = false;

  for (const line of lines) {
    if (!foundHeading && PLAN_HEADING_RE.test(line)) {
      title = line.replace(/^#{1,3}\s*/, "").trim();
      foundHeading = true;
      continue;
    }

    const stepMatch = line.match(/^\d+\.\s+(.+)/);
    if (stepMatch && foundHeading) {
      const label = stepMatch[1];
      let type: PlanStep["type"] = "unknown";
      if (READ_TAG_RE.test(label)) type = "read";
      if (WRITE_TAG_RE.test(label)) type = "write";
      const hasBudgetRisk = BUDGET_RE.test(label);
      steps.push({ index: steps.length + 1, label, type, hasBudgetRisk });
      if (hasBudgetRisk) {
        warnings.push(label);
      }
      continue;
    }

    if (PLAN_CONFIRM_RE.test(line) && steps.length > 0) {
      confirmText = line.replace(/^[-*>]\s*/, "").trim();
    }

    if (/^[>⚠️❗]\s*/.test(line) && BUDGET_RE.test(line)) {
      warnings.push(line.replace(/^[>⚠️❗]\s*/, "").trim());
    }
  }

  if (steps.length < 2) return null;
  return {
    title: title || "Execution Plan",
    steps,
    warnings,
    confirmText,
  };
}

const ERROR_HEADING_RE =
  /^#{1,3}\s*(?:❌|⚠️|🔴)?\s*(?:操作失败|执行失败|错误|失败报告|error|failed|failure|operation failed)/i;
const ERROR_FIELD_MAP: Record<string, RegExp> = {
  failedStep: /失败步骤|failed\s*step/i,
  impact: /影响范围|影响|impact/i,
  reason: /原因摘要|原因|reason|cause/i,
  recovery: /恢复建议|恢复动作|recovery|可选恢复|suggestion/i,
};

function detectErrorReport(content: string): ErrorReportData | null {
  const lines = content.split("\n");
  let title = "";
  const fields: Array<{ label: string; value: string }> = [];
  let recovery: string | undefined;
  let matchedFields = 0;

  for (const line of lines) {
    if (!title && ERROR_HEADING_RE.test(line)) {
      title = line.replace(/^#{1,3}\s*/, "").trim();
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+\*{0,2}(.+?)\*{0,2}\s*[:：]\s*(.+)/);
    if (bulletMatch) {
      const [, rawLabel, value] = bulletMatch;
      const label = rawLabel.replace(/\*+/g, "").trim();

      for (const [key, re] of Object.entries(ERROR_FIELD_MAP)) {
        if (re.test(label)) {
          matchedFields++;
          if (key === "recovery") {
            recovery = value.trim();
          }
          fields.push({ label, value: value.trim() });
          break;
        }
      }
      if (!Object.values(ERROR_FIELD_MAP).some((re) => re.test(label))) {
        fields.push({ label, value: value.trim() });
      }
    }
  }

  if (matchedFields < 2) return null;
  return {
    title: title || "Operation Failed",
    fields,
    recovery,
  };
}

export function parseResponse(content: string): ContentSegment[] {
  const errorCheck = detectErrorReport(content);
  if (errorCheck) {
    return [{ type: "error-report", content, error: errorCheck }];
  }

  const planCheck = detectPlanReview(content);
  if (planCheck) {
    return [{ type: "plan-review", content, plan: planCheck }];
  }

  const lines = content.split("\n");
  const segments: ContentSegment[] = [];
  let mdBuffer: string[] = [];

  const flushMarkdown = () => {
    const md = mdBuffer.join("\n").trim();
    if (md) {
      segments.push({ type: "markdown", content: md });
    }
    mdBuffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    if (
      isTableRow(lines[i]) &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      flushMarkdown();
      const tableLines = [lines[i], lines[i + 1]];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseTableBlock(tableLines);
      if (table) {
        segments.push({
          type: "interactive-table",
          content: tableLines.join("\n"),
          table,
        });
      } else {
        mdBuffer.push(...tableLines);
      }
      continue;
    }

    mdBuffer.push(lines[i]);
    i++;
  }
  flushMarkdown();

  return segments;
}
