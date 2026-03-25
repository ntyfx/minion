import { describe, it, expect, beforeEach } from "vitest";
import {
  createSession,
  loadActiveSessionId,
  saveActiveSessionId,
  addMessageToSession,
  addActivityToSession,
  generateId,
  generateMessageId,
} from "@/lib/sessions";

beforeEach(() => {
  localStorage.clear();
});

describe("createSession", () => {
  it("creates a session with default label", () => {
    const s = createSession();
    expect(s.id).toMatch(/^sess_/);
    expect(s.label).toBe("New Chat");
    expect(s.icon).toBe("MessageOutlined");
    expect(s.messages).toEqual([]);
    expect(s.activity).toEqual([]);
    expect(s.createdAt).toBeGreaterThan(0);
    expect(s.updatedAt).toBe(s.createdAt);
  });

  it("creates a session with custom label", () => {
    const s = createSession("My Chat");
    expect(s.label).toBe("My Chat");
  });

  it("creates a session with env field", () => {
    const s = createSession("Env Chat", undefined, "staging");
    expect(s.env).toBe("staging");
  });

  it("creates a session without env when not provided", () => {
    const s = createSession();
    expect(s.env).toBeUndefined();
  });

  it("generates unique IDs", () => {
    const a = createSession();
    const b = createSession();
    expect(a.id).not.toBe(b.id);
  });
});

describe("loadActiveSessionId / saveActiveSessionId", () => {
  it("returns null when nothing stored", () => {
    expect(loadActiveSessionId()).toBeNull();
  });

  it("round-trips active session ID", () => {
    saveActiveSessionId("sess_abc");
    expect(loadActiveSessionId()).toBe("sess_abc");
  });
});

describe("addMessageToSession", () => {
  it("adds a message with correct role and content", () => {
    const session = createSession();
    const msg = addMessageToSession(session, "user", "hello");
    expect(msg.id).toMatch(/^msg_/);
    expect(msg.role).toBe("user");
    expect(msg.content).toBe("hello");
    expect(msg.timestamp).toBeGreaterThan(0);
    expect(session.messages).toHaveLength(1);
    expect(session.messages[0]).toBe(msg);
  });

  it("updates session updatedAt", () => {
    const session = createSession();
    const before = session.updatedAt;
    addMessageToSession(session, "assistant", "hi");
    expect(session.updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("supports all message roles", () => {
    const session = createSession();
    const roles = [
      "user",
      "assistant",
      "system",
      "reasoning",
      "error",
    ] as const;
    for (const role of roles) {
      const msg = addMessageToSession(session, role, `test-${role}`);
      expect(msg.role).toBe(role);
    }
    expect(session.messages).toHaveLength(5);
  });
});

describe("addActivityToSession", () => {
  it("adds an activity event", () => {
    const session = createSession();
    const evt = addActivityToSession(session, "chunk", { content: "data" });
    expect(evt.id).toMatch(/^evt_/);
    expect(evt.type).toBe("chunk");
    expect(evt.payload).toEqual({ content: "data" });
    expect(session.activity).toHaveLength(1);
  });

  it("updates session updatedAt", () => {
    const session = createSession();
    const before = session.updatedAt;
    addActivityToSession(session, "done", null);
    expect(session.updatedAt).toBeGreaterThanOrEqual(before);
  });
});

describe("generateId fallback", () => {
  it("uses fallback when crypto.randomUUID is unavailable", () => {
    const origCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: undefined },
      configurable: true,
    });
    try {
      const id = generateId();
      expect(id).toMatch(/^sess_\d+_[0-9a-f]+$/);
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: origCrypto,
        configurable: true,
      });
    }
  });

  it("uses crypto.randomUUID when available", () => {
    const id = generateId();
    expect(id).toMatch(/^sess_/);
  });
});

describe("generateMessageId", () => {
  it("produces unique ids", () => {
    const a = generateMessageId();
    const b = generateMessageId();
    expect(a).toMatch(/^msg_/);
    expect(b).toMatch(/^msg_/);
    expect(a).not.toBe(b);
  });
});
