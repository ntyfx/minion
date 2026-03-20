"use client";

import { memo, useMemo } from "react";
import { XMarkdown } from "@ant-design/x-markdown";
import "@ant-design/x-markdown/themes/dark.css";
import { parseResponse } from "@/lib/response-parser";
import type { ContentSegment } from "@/lib/response-parser";
import { PlanReviewCard } from "./plan-review-card";
import { InteractiveTable } from "./interactive-table";
import { ErrorReportCard } from "./error-report-card";

interface RichContentProps {
  content: string;
  onAction?: (message: string) => void;
}

function SegmentRenderer({
  segment,
  onAction,
}: {
  segment: ContentSegment;
  onAction?: (message: string) => void;
}) {
  switch (segment.type) {
    case "plan-review":
      return segment.plan ? (
        <PlanReviewCard plan={segment.plan} onAction={onAction} />
      ) : (
        <XMarkdown content={segment.content} openLinksInNewTab className="chat-markdown" />
      );
    case "interactive-table":
      return segment.table ? (
        <InteractiveTable table={segment.table} />
      ) : (
        <XMarkdown content={segment.content} openLinksInNewTab className="chat-markdown" />
      );
    case "error-report":
      return segment.error ? (
        <ErrorReportCard error={segment.error} onAction={onAction} />
      ) : (
        <XMarkdown content={segment.content} openLinksInNewTab className="chat-markdown" />
      );
    case "markdown":
    default:
      return (
        <XMarkdown content={segment.content} openLinksInNewTab className="chat-markdown" />
      );
  }
}

export const RichContent = memo(function RichContent({
  content,
  onAction,
}: RichContentProps) {
  const segments = useMemo(() => parseResponse(content), [content]);

  if (segments.length === 1 && segments[0].type === "markdown") {
    return (
      <XMarkdown content={content} openLinksInNewTab className="chat-markdown" />
    );
  }

  return (
    <div className="rich-content-root">
      {segments.map((seg, i) => (
        <SegmentRenderer key={i} segment={seg} onAction={onAction} />
      ))}
    </div>
  );
});
