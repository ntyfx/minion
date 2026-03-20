import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  exportAsMarkdown,
  exportAsJson,
  exportAsHtml,
  downloadMarkdown,
  downloadJson,
  downloadHtml,
} from "@/lib/export";
import { downloadBlob } from "@/lib/download";
import { createSession, addMessageToSession } from "@/lib/sessions";

vi.mock("@/lib/download", () => ({
  downloadBlob: vi.fn(),
}));

function buildSession() {
  const session = createSession("Test");
  addMessageToSession(session, "user", "hello");
  addMessageToSession(session, "assistant", "hi there");
  addMessageToSession(session, "system", "ignored in md/html");
  return session;
}

describe("export", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2020-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("exportAsMarkdown", () => {
    it("includes header with session label and formats user/assistant messages", () => {
      const session = buildSession();
      const md = exportAsMarkdown(session, "all");
      expect(md).toContain("# Test");
      expect(md).toContain("Exported:");
      expect(md).toContain("**You**");
      expect(md).toContain("hello");
      expect(md).toContain("**Assistant**");
      expect(md).toContain("hi there");
      expect(md).not.toContain("ignored in md/html");
    });

    it("with filter assistant only includes assistant messages", () => {
      const session = buildSession();
      const md = exportAsMarkdown(session, "assistant");
      expect(md).toContain("**Assistant**");
      expect(md).toContain("hi there");
      expect(md).not.toContain("**You**");
      expect(md).not.toContain("hello");
    });
  });

  describe("exportAsJson", () => {
    it("returns valid JSON with correct structure", () => {
      const session = buildSession();
      const json = exportAsJson(session);
      const data = JSON.parse(json) as {
        id: string;
        label: string;
        tags: string[];
        exportedAt: string;
        messages: Array<{ role: string; content: string; timestamp: string }>;
      };
      expect(data.id).toBe(session.id);
      expect(data.label).toBe("Test");
      expect(Array.isArray(data.tags)).toBe(true);
      expect(data.exportedAt).toBe("2020-06-15T12:00:00.000Z");
      expect(data.messages).toHaveLength(3);
      expect(data.messages.map((m) => m.role)).toEqual(["user", "assistant", "system"]);
    });
  });

  describe("exportAsHtml", () => {
    it("returns HTML with escaped content and message blocks", () => {
      const session = createSession("<Script>");
      addMessageToSession(session, "user", "a <b>tag</b>");
      addMessageToSession(session, "assistant", "line1\nline2");
      const html = exportAsHtml(session);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("&lt;Script>");
      expect(html).toContain("&lt;b>tag&lt;/b>");
      expect(html).toContain('class="msg user"');
      expect(html).toContain('class="msg assistant"');
      expect(html).toContain("line1<br>line2");
    });
  });

  describe("download helpers", () => {
    beforeEach(() => {
      vi.mocked(downloadBlob).mockClear();
    });

    it("downloadMarkdown delegates to downloadBlob with markdown", () => {
      const session = buildSession();
      downloadMarkdown(session, "all");
      expect(downloadBlob).toHaveBeenCalledOnce();
      expect(downloadBlob).toHaveBeenCalledWith(
        exportAsMarkdown(session, "all"),
        `${session.label}.md`,
        "text/markdown",
      );
    });

    it("downloadMarkdown passes assistant filter to export", () => {
      const session = buildSession();
      downloadMarkdown(session, "assistant");
      expect(downloadBlob).toHaveBeenCalledWith(
        exportAsMarkdown(session, "assistant"),
        `${session.label}.md`,
        "text/markdown",
      );
    });

    it("downloadJson delegates to downloadBlob with JSON", () => {
      const session = buildSession();
      downloadJson(session);
      expect(downloadBlob).toHaveBeenCalledOnce();
      expect(downloadBlob).toHaveBeenCalledWith(
        exportAsJson(session),
        `${session.label}.json`,
        "application/json",
      );
    });

    it("downloadHtml delegates to downloadBlob with HTML", () => {
      const session = buildSession();
      downloadHtml(session);
      expect(downloadBlob).toHaveBeenCalledOnce();
      expect(downloadBlob).toHaveBeenCalledWith(
        exportAsHtml(session),
        `${session.label}.html`,
        "text/html",
      );
    });
  });
});
