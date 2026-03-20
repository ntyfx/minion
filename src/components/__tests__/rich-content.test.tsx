import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, screen, within, waitFor } from "@testing-library/react";
import { RichContent } from "@/components/rich-content/rich-content";
import { PlanReviewCard } from "@/components/rich-content/plan-review-card";
import { InteractiveTable } from "@/components/rich-content/interactive-table";
import { ErrorReportCard } from "@/components/rich-content/error-report-card";
import { parseResponse } from "@/lib/response-parser";
import type { PlanData, ErrorReportData, TableData } from "@/lib/response-parser";

vi.mock("@ant-design/x-markdown", () => ({
  XMarkdown: ({
    content,
    className,
  }: {
    content: string;
    className?: string;
  }) => (
    <div data-testid="x-markdown" data-classname={className ?? ""}>
      {content}
    </div>
  ),
}));

describe("PlanReviewCard", () => {
  const basePlan: PlanData = {
    title: "My rollout plan",
    steps: [
      {
        index: 1,
        label: "只读查询配置",
        type: "read",
        hasBudgetRisk: false,
      },
      {
        index: 2,
        label: "更新广告组状态",
        type: "write",
        hasBudgetRisk: false,
      },
    ],
    warnings: [],
    confirmText: "OK?",
  };

  it("renders plan title and steps", () => {
    render(<PlanReviewCard plan={basePlan} />);
    expect(screen.getByText("My rollout plan")).toBeInTheDocument();
    expect(screen.getByText("只读查询配置")).toBeInTheDocument();
    expect(screen.getByText("更新广告组状态")).toBeInTheDocument();
  });

  it("shows read/write tags on steps", () => {
    const { container } = render(<PlanReviewCard plan={basePlan} />);
    const stepsRoot = container.querySelector(".rich-plan-steps");
    expect(stepsRoot).toBeTruthy();
    expect(
      within(stepsRoot as HTMLElement).getAllByText("richContent.stepRead").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(stepsRoot as HTMLElement).getByText("richContent.stepWrite"),
    ).toBeInTheDocument();
  });

  it("shows budget warning when warnings exist", () => {
    const plan: PlanData = {
      ...basePlan,
      warnings: ["Budget risk on step 1"],
    };
    render(<PlanReviewCard plan={plan} />);
    expect(screen.getByText(/Budget risk on step 1/)).toBeInTheDocument();
  });

  it("calls onAction with approve message", () => {
    const onAction = vi.fn();
    render(<PlanReviewCard plan={basePlan} onAction={onAction} />);
    fireEvent.click(
      screen.getByRole("button", { name: /richContent\.planApprove/ }),
    );
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("richContent.planApproveMessage");
  });

  it("calls onAction with reject message", () => {
    const onAction = vi.fn();
    render(<PlanReviewCard plan={basePlan} onAction={onAction} />);
    fireEvent.click(
      screen.getByRole("button", { name: /richContent\.planReject/ }),
    );
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("richContent.planRejectMessage");
  });
});

describe("ErrorReportCard", () => {
  const baseError: ErrorReportData = {
    title: "Payment failed",
    fields: [
      { label: "Code", value: "E_100" },
      { label: "Detail", value: "Timeout" },
    ],
  };

  it("renders error title and fields", () => {
    render(<ErrorReportCard error={baseError} />);
    expect(screen.getByText("Payment failed")).toBeInTheDocument();
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("E_100")).toBeInTheDocument();
    expect(screen.getByText("Detail")).toBeInTheDocument();
    expect(screen.getByText("Timeout")).toBeInTheDocument();
  });

  it("shows recovery button when recovery exists", () => {
    render(
      <ErrorReportCard error={{ ...baseError, recovery: "Retry payment" }} />,
    );
    expect(screen.getByText("richContent.errorRetry")).toBeInTheDocument();
  });

  it("calls onAction with recovery message", () => {
    const onAction = vi.fn();
    render(
      <ErrorReportCard
        error={{ ...baseError, recovery: "Please retry" }}
        onAction={onAction}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /richContent\.errorRetry/ }),
    );
    expect(onAction).toHaveBeenCalledOnce();
    expect(onAction).toHaveBeenCalledWith("Please retry");
  });
});

describe("InteractiveTable", () => {
  const table: TableData = {
    headers: ["Name", "Qty"],
    rows: [
      ["Apple", "2"],
      ["Pear", "1"],
    ],
  };

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders table headers and rows", () => {
    const { container } = render(<InteractiveTable table={table} />);
    const wrapper = container.querySelector(".rich-table-wrapper");
    expect(wrapper).toBeTruthy();
    const scoped = within(wrapper as HTMLElement);
    expect(scoped.getAllByText("Name").length).toBeGreaterThanOrEqual(1);
    expect(scoped.getAllByText("Qty").length).toBeGreaterThanOrEqual(1);
    expect(scoped.getByText("Apple")).toBeInTheDocument();
    expect(scoped.getByText("Pear")).toBeInTheDocument();
  });

  it("has CSV export button", () => {
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const realCreate = document.createElement.bind(document);
    const click = vi.fn();
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const a = realCreate("a");
        a.click = click;
        return a;
      }
      return realCreate(tag);
    });

    const { container } = render(<InteractiveTable table={table} />);
    const exportBtn = container.querySelector(".anticon-download")?.closest(
      "button",
    );
    expect(exportBtn).toBeTruthy();
    fireEvent.click(exportBtn!);

    expect(createUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revoke).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("filters rows by search input", () => {
    const bigTable: TableData = {
      headers: ["Name", "Qty"],
      rows: [
        ["Apple", "2"],
        ["Banana", "3"],
      ],
    };
    const { container } = render(<InteractiveTable table={bigTable} />);
    const search = container.querySelector(
      'input[placeholder="richContent.tableSearch"]',
    ) as HTMLInputElement;
    expect(search).toBeTruthy();
    fireEvent.change(search, { target: { value: "banana" } });
    expect(container.textContent).toContain("Banana");
    expect(container.textContent).not.toContain("Apple");
    expect(container.textContent).toContain("richContent.tableRows");
  });

  it("sorts rows when column header is clicked", async () => {
    const sortTable: TableData = {
      headers: ["Name", "Qty"],
      rows: [
        ["Zebra", "1"],
        ["Apple", "2"],
      ],
    };
    const { container } = render(<InteractiveTable table={sortTable} />);
    const nameHeader = Array.from(container.querySelectorAll("th")).find((th) =>
      th.textContent?.includes("Name"),
    );
    expect(nameHeader).toBeTruthy();
    const sorter =
      nameHeader!.querySelector(".ant-table-column-sorter-inner") ??
      nameHeader!.querySelector(".ant-table-column-sorter") ??
      nameHeader!;
    fireEvent.click(sorter);

    const dataCells = [
      ...container.querySelectorAll(".ant-table-tbody .ant-table-cell"),
    ].map((c) => c.textContent?.trim() ?? "");
    const appleIdx = dataCells.indexOf("Apple");
    const zebraIdx = dataCells.indexOf("Zebra");
    expect(appleIdx).toBeGreaterThanOrEqual(0);
    expect(zebraIdx).toBeGreaterThanOrEqual(0);
    expect(appleIdx).toBeLessThan(zebraIdx);
  });

  it("copies tab-separated table via toolbar copy button", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    const { container } = render(<InteractiveTable table={table} />);
    const copyBtn = container.querySelector(".anticon-copy")?.closest("button");
    expect(copyBtn).toBeTruthy();
    fireEvent.click(copyBtn!);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("Name\tQty\nApple\t2\nPear\t1");
    });
  });
});

describe("RichContent", () => {
  it("renders markdown content for plain text", () => {
    const text = "Hello **world**";
    render(<RichContent content={text} />);
    const md = screen.getByTestId("x-markdown");
    expect(md).toHaveTextContent(text);
    expect(md).toHaveAttribute("data-classname", "chat-markdown");
  });

  it("renders plan-review card for plan content", () => {
    const content = [
      "## Execution plan",
      "1. read only step",
      "2. write change step",
    ].join("\n");
    expect(parseResponse(content)[0].type).toBe("plan-review");
    render(<RichContent content={content} />);
    expect(document.querySelector(".rich-plan-card")).toBeInTheDocument();
  });

  it("renders error-report card for error content", () => {
    const content = [
      "## 操作失败",
      "- **失败步骤**: 更新出价",
      "- **影响范围**: 单个广告组",
      "- **原因**: 权限不足",
    ].join("\n");
    expect(parseResponse(content)[0].type).toBe("error-report");
    render(<RichContent content={content} />);
    expect(document.querySelector(".rich-error-card")).toBeInTheDocument();
  });

  it("renders interactive table for table content", () => {
    const content = ["| A | B |", "| --- | --- |", "| 1 | 2 |"].join("\n");
    expect(parseResponse(content)[0].type).toBe("interactive-table");
    render(<RichContent content={content} />);
    expect(document.querySelector(".rich-table-wrapper")).toBeInTheDocument();
  });

  it("renders mixed segments inside rich-content-root", () => {
    const content = [
      "Intro",
      "",
      "| X |",
      "| --- |",
      "| y |",
    ].join("\n");
    const { container } = render(<RichContent content={content} />);
    const root = container.querySelector(".rich-content-root");
    expect(root).toBeInTheDocument();
    expect(within(root! as HTMLElement).getByTestId("x-markdown")).toHaveTextContent("Intro");
    expect(root!.querySelector(".rich-table-wrapper")).toBeInTheDocument();
  });
});
