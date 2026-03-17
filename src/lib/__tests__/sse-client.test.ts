import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readChunkContent,
  readReasoningContent,
  streamChat,
  fetchSkills,
  type SSEEvent,
  type SSEEventHandler,
} from "@/lib/sse-client";
import type { SSEChunkPayload } from "@/types/chat";

describe("readChunkContent", () => {
  it("returns content field", () => {
    expect(readChunkContent({ content: "hello" })).toBe("hello");
  });

  it("returns chunk field", () => {
    expect(readChunkContent({ chunk: "data" })).toBe("data");
  });

  it("returns delta field", () => {
    expect(readChunkContent({ delta: "d" })).toBe("d");
  });

  it("returns summary field", () => {
    expect(readChunkContent({ summary: "sum" })).toBe("sum");
  });

  it("returns message field", () => {
    expect(readChunkContent({ message: "msg" })).toBe("msg");
  });

  it("falls back to JSON.stringify", () => {
    const result = readChunkContent({ status: "ok" });
    expect(result).toContain('"status"');
    expect(result).toContain('"ok"');
  });

  it("prefers content over other fields", () => {
    expect(
      readChunkContent({ content: "first", chunk: "second", delta: "third" }),
    ).toBe("first");
  });
});

describe("readReasoningContent", () => {
  it("extracts text from reasoning_details", () => {
    const payload: SSEChunkPayload = {
      reasoning_details: [{ text: "step 1" }, { text: "step 2" }],
    };
    expect(readReasoningContent(payload)).toBe("step 1step 2");
  });

  it("extracts summary from reasoning_details", () => {
    const payload: SSEChunkPayload = {
      reasoning_details: [{ summary: "brief" }],
    };
    expect(readReasoningContent(payload)).toBe("brief");
  });

  it("returns [encrypted reasoning] for data-only details", () => {
    const payload: SSEChunkPayload = {
      reasoning_details: [{ data: "base64stuff" }],
    };
    expect(readReasoningContent(payload)).toBe("[encrypted reasoning]");
  });

  it("falls back to message field when no reasoning_details", () => {
    const payload: SSEChunkPayload = { message: "fallback msg" };
    expect(readReasoningContent(payload)).toBe("fallback msg");
  });

  it("falls back to readChunkContent for string-like payload", () => {
    expect(
      readReasoningContent("raw text" as unknown as SSEChunkPayload),
    ).toBe("raw text");
  });

  it("skips empty reasoning_details entries", () => {
    const payload: SSEChunkPayload = {
      reasoning_details: [
        null as unknown as { text?: string },
        { text: "" },
        { text: "valid" },
      ],
    };
    expect(readReasoningContent(payload)).toBe("valid");
  });
});

describe("SSE buffer processing (via streamChat)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function makeSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
  }

  it("parses a single SSE event", async () => {
    const events: SSEEvent[] = [];
    const handler: SSEEventHandler = (e) => events.push(e);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeSSEStream(['event: chunk\ndata: {"content":"hi"}\n\n']), {
        status: 200,
      }),
    );

    await streamChat(
      {
        baseUrl: "http://test",
        accessToken: "tok",
        sessionId: "s1",
        message: "hello",
      },
      handler,
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("chunk");
    expect(events[0].payload).toEqual({ content: "hi" });
  });

  it("parses multiple SSE events", async () => {
    const events: SSEEvent[] = [];
    const handler: SSEEventHandler = (e) => events.push(e);

    const stream =
      'event: chunk\ndata: {"content":"a"}\n\nevent: done\ndata: {"status":"ok"}\n\n';

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeSSEStream([stream]), { status: 200 }),
    );

    await streamChat(
      {
        baseUrl: "http://test",
        accessToken: "tok",
        sessionId: "s1",
        message: "hi",
      },
      handler,
    );

    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("chunk");
    expect(events[1].type).toBe("done");
  });

  it("handles split chunks across stream reads", async () => {
    const events: SSEEvent[] = [];
    const handler: SSEEventHandler = (e) => events.push(e);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        makeSSEStream([
          'event: chunk\ndata: {"con',
          'tent":"split"}\n\n',
        ]),
        { status: 200 },
      ),
    );

    await streamChat(
      {
        baseUrl: "http://test",
        accessToken: "tok",
        sessionId: "s1",
        message: "hi",
      },
      handler,
    );

    expect(events).toHaveLength(1);
    expect(events[0].payload).toEqual({ content: "split" });
  });

  it("skips SSE comment lines", async () => {
    const events: SSEEvent[] = [];
    const handler: SSEEventHandler = (e) => events.push(e);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        makeSSEStream([': keep-alive\nevent: chunk\ndata: {"content":"ok"}\n\n']),
        { status: 200 },
      ),
    );

    await streamChat(
      {
        baseUrl: "http://test",
        accessToken: "tok",
        sessionId: "s1",
        message: "hi",
      },
      handler,
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("chunk");
  });

  it("defaults to 'message' event type when no event: line", async () => {
    const events: SSEEvent[] = [];
    const handler: SSEEventHandler = (e) => events.push(e);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeSSEStream(['data: {"content":"hi"}\n\n']), {
        status: 200,
      }),
    );

    await streamChat(
      {
        baseUrl: "http://test",
        accessToken: "tok",
        sessionId: "s1",
        message: "hi",
      },
      handler,
    );

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe("message");
  });

  it("throws on non-ok HTTP response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401, statusText: "Unauthorized" }),
    );

    await expect(
      streamChat(
        {
          baseUrl: "http://test",
          accessToken: "bad",
          sessionId: "s1",
          message: "hi",
        },
        () => {},
      ),
    ).rejects.toThrow("HTTP 401");
  });

  it("parses non-JSON data as raw", async () => {
    const events: SSEEvent[] = [];
    const handler: SSEEventHandler = (e) => events.push(e);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(makeSSEStream(["data: plain text\n\n"]), { status: 200 }),
    );

    await streamChat(
      {
        baseUrl: "http://test",
        accessToken: "tok",
        sessionId: "s1",
        message: "hi",
      },
      handler,
    );

    expect(events).toHaveLength(1);
    expect(events[0].payload).toEqual({ raw: "plain text" });
  });
});

describe("fetchSkills", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    const mockData = { skills: [{ name: "a", status: "eligible" }] };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchSkills("http://test", "tok");
    expect(result).toEqual(mockData);
  });

  it("throws on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Forbidden", { status: 403, statusText: "Forbidden" }),
    );

    await expect(fetchSkills("http://test", "tok")).rejects.toThrow("HTTP 403");
  });

  it("falls back to statusText when .text() rejects", async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: () => Promise.reject(new Error("read failed")),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse as unknown as Response,
    );

    await expect(fetchSkills("http://test", "tok")).rejects.toThrow(
      "HTTP 500: Internal Server Error",
    );
  });
});

describe("readReasoningContent edge cases", () => {
  it("falls back to readChunkContent when reasoning_details is empty and no message", () => {
    const payload: SSEChunkPayload = {
      reasoning_details: [],
      content: "fallback content",
    };
    expect(readReasoningContent(payload)).toBe("fallback content");
  });
});

describe("streamChat error edge cases", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to statusText when response.text() rejects", async () => {
    const mockResponse = {
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      body: null,
      text: () => Promise.reject(new Error("read failed")),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      mockResponse as unknown as Response,
    );

    await expect(
      streamChat(
        {
          baseUrl: "http://test",
          accessToken: "tok",
          sessionId: "s1",
          message: "hi",
        },
        () => {},
      ),
    ).rejects.toThrow("HTTP 502: Bad Gateway");
  });
});
