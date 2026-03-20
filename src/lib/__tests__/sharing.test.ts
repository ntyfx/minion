import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sessionToShareable,
  shareableToSession,
  readShareFile,
  downloadShareFile,
  BUILTIN_TEMPLATES,
} from "@/lib/sharing";
import { downloadBlob } from "@/lib/download";
import { createSession, addMessageToSession } from "@/lib/sessions";

vi.mock("@/lib/download", () => ({
  downloadBlob: vi.fn(),
}));

describe("sessionToShareable", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2021-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("produces correct SharedSession structure", () => {
    const session = createSession("My chat");
    session.tags = ["a", "b"];
    addMessageToSession(session, "user", "u1");
    addMessageToSession(session, "assistant", "a1");
    addMessageToSession(session, "system", "sys");

    const shared = sessionToShareable(session);
    expect(shared.version).toBe(1);
    expect(shared.label).toBe("My chat");
    expect(shared.tags).toEqual(["a", "b"]);
    expect(shared.exportedAt).toBe("2021-01-01T00:00:00.000Z");
    expect(shared.messages).toHaveLength(2);
    expect(shared.messages[0]).toMatchObject({ role: "user", content: "u1" });
    expect(shared.messages[1]).toMatchObject({ role: "assistant", content: "a1" });
    expect(typeof shared.messages[0].timestamp).toBe("string");
  });
});

describe("shareableToSession", () => {
  it("creates session with [Shared] prefix and correct messages", () => {
    const shared = {
      version: 1 as const,
      label: "Orig",
      tags: ["t"],
      exportedAt: "2021-01-01T00:00:00.000Z",
      messages: [
        {
          role: "user" as const,
          content: "hello",
          timestamp: "2021-01-02T00:00:00.000Z",
        },
        {
          role: "assistant" as const,
          content: "hi",
          timestamp: "2021-01-02T00:00:01.000Z",
        },
      ],
    };
    const session = shareableToSession(shared, "new-id-1");
    expect(session.id).toBe("new-id-1");
    expect(session.label).toBe("[Shared] Orig");
    expect(session.tags).toEqual(["t"]);
    expect(session.messages).toHaveLength(2);
    expect(session.messages[0].content).toBe("hello");
    expect(session.messages[0].role).toBe("user");
    expect(session.messages[1].content).toBe("hi");
    expect(session.messages.every((m) => m.id.startsWith("msg_"))).toBe(true);
  });
});

describe("readShareFile", () => {
  it("rejects invalid format when version is missing or not 1", async () => {
    const badVersion = new File([JSON.stringify({ messages: [] })], "test.minion", {
      type: "application/json",
    });
    await expect(readShareFile(badVersion)).rejects.toThrow("Invalid .minion file format");
  });

  it("rejects invalid format when messages is not an array", async () => {
    const badMessages = new File([JSON.stringify({ version: 1, messages: null })], "t.minion", {
      type: "application/json",
    });
    await expect(readShareFile(badMessages)).rejects.toThrow("Invalid .minion file format");
  });

  it("accepts valid share payload", async () => {
    const data = {
      version: 1,
      label: "L",
      tags: [],
      exportedAt: "2020-01-01T00:00:00.000Z",
      messages: [
        { role: "user", content: "c", timestamp: "2020-01-01T00:00:00.000Z" },
      ],
    };
    const mockFile = new File([JSON.stringify(data)], "test.minion", {
      type: "application/json",
    });
    const parsed = await readShareFile(mockFile);
    expect(parsed.version).toBe(1);
    expect(parsed.messages).toHaveLength(1);
    expect(parsed.messages[0].content).toBe("c");
  });
});

describe("BUILTIN_TEMPLATES", () => {
  it("is a non-empty array", () => {
    expect(Array.isArray(BUILTIN_TEMPLATES)).toBe(true);
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThan(0);
  });
});

describe("downloadShareFile", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2022-03-04T00:00:00.000Z"));
    vi.mocked(downloadBlob).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls downloadBlob with shareable JSON and sanitized filename", () => {
    const session = createSession("My Session / v1");
    addMessageToSession(session, "user", "hi");
    downloadShareFile(session);

    expect(downloadBlob).toHaveBeenCalledOnce();
    const [content, filename, mime] = vi.mocked(downloadBlob).mock.calls[0];
    expect(mime).toBe("application/json");
    expect(filename).toBe("My_Session___v1.minion");
    const parsed = JSON.parse(content as string) as { version: number; label: string };
    expect(parsed.version).toBe(1);
    expect(parsed.label).toBe("My Session / v1");
  });
});
