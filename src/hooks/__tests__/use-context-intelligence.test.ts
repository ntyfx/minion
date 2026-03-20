import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import {
  createSession,
  addMessageToSession,
  addActivityToSession,
} from "@/lib/sessions";
import {
  getSessionSummary,
  useRelatedSessions,
  useInputSuggestions,
} from "../use-context-intelligence";

describe("getSessionSummary", () => {
  it("returns empty string for session with no messages and no activity", () => {
    const session = createSession();
    expect(getSessionSummary(session)).toBe("");
  });

  it("returns first AI message content (truncated to 120 chars + \"…\") when no summary event", () => {
    const session = createSession();
    addMessageToSession(session, "user", "question");
    const long = "x".repeat(121);
    addMessageToSession(session, "assistant", long);
    expect(getSessionSummary(session)).toBe("x".repeat(120) + "…");
  });

  it("returns full content when AI message <= 120 chars (no \"…\")", () => {
    const session = createSession();
    addMessageToSession(session, "user", "question");
    const text = "a".repeat(120);
    addMessageToSession(session, "assistant", text);
    expect(getSessionSummary(session)).toBe(text);
  });

  it("returns summary event payload when present", () => {
    const session = createSession();
    addMessageToSession(session, "user", "question");
    addMessageToSession(session, "assistant", "ignored when summary exists");
    addActivityToSession(session, "summary", "From activity summary");
    expect(getSessionSummary(session)).toBe("From activity summary");
  });
});

describe("useRelatedSessions", () => {
  it("returns empty array when currentSession is null", () => {
    const other = createSession();
    addMessageToSession(other, "user", "hello world");
    const { result } = renderHook(() =>
      useRelatedSessions(null, [other], 3),
    );
    expect(result.current).toEqual([]);
  });

  it("returns empty array when currentSession has no messages", () => {
    const current = createSession();
    current.tags = ["alpha"];
    const other = createSession();
    addMessageToSession(other, "user", "alpha beta gamma");
    const { result } = renderHook(() =>
      useRelatedSessions(current, [other], 3),
    );
    expect(result.current).toEqual([]);
  });

  it("returns related sessions based on shared keywords (tags and user message words)", () => {
    const current = createSession();
    current.tags = ["planning"];
    addMessageToSession(current, "user", "hello world planning");

    const relatedByTag = createSession();
    relatedByTag.tags = ["planning"];
    addMessageToSession(relatedByTag, "user", "something else");

    const relatedByWord = createSession();
    addMessageToSession(relatedByWord, "user", "team planning notes");

    const unrelated = createSession();
    addMessageToSession(unrelated, "user", "totally different topic");

    const { result } = renderHook(() =>
      useRelatedSessions(current, [relatedByTag, relatedByWord, unrelated], 5),
    );

    const ids = result.current.map((s) => s.id);
    expect(ids).toContain(relatedByTag.id);
    expect(ids).toContain(relatedByWord.id);
    expect(ids).not.toContain(unrelated.id);
  });

  it("excludes archived sessions", () => {
    const current = createSession();
    addMessageToSession(current, "user", "shared keyword here");

    const archived = createSession();
    archived.archived = true;
    archived.tags = ["keyword"];
    addMessageToSession(archived, "user", "more text");

    const active = createSession();
    active.tags = ["keyword"];
    addMessageToSession(active, "user", "more text");

    const { result } = renderHook(() =>
      useRelatedSessions(current, [archived, active], 5),
    );

    expect(result.current.map((s) => s.id)).toEqual([active.id]);
  });

  it("excludes the current session itself", () => {
    const current = createSession();
    current.tags = ["overlap"];
    addMessageToSession(current, "user", "overlap content");

    const { result } = renderHook(() =>
      useRelatedSessions(current, [current], 3),
    );

    expect(result.current).toEqual([]);
  });

  it("respects limit parameter", () => {
    const current = createSession();
    current.tags = ["shared"];
    addMessageToSession(current, "user", "shared context");

    const makeRelated = () => {
      const s = createSession();
      s.tags = ["shared"];
      addMessageToSession(s, "user", "related body");
      return s;
    };

    const extras = [makeRelated(), makeRelated(), makeRelated(), makeRelated()];

    const { result } = renderHook(() =>
      useRelatedSessions(current, extras, 2),
    );

    expect(result.current).toHaveLength(2);
    expect(
      result.current.every((r) => extras.some((e) => e.id === r.id)),
    ).toBe(true);
  });
});

describe("useInputSuggestions", () => {
  it("returns empty array when input is less than 3 chars", () => {
    const s = createSession();
    addMessageToSession(s, "user", "hello world");
    const { result } = renderHook(() =>
      useInputSuggestions("he", [s], 5),
    );
    expect(result.current).toEqual([]);
  });

  it("returns matching user messages from sessions", () => {
    const s = createSession();
    addMessageToSession(s, "user", "please deploy the dashboard");
    const { result } = renderHook(() =>
      useInputSuggestions("dashboard", [s], 5),
    );
    expect(result.current).toEqual(["please deploy the dashboard"]);
  });

  it("respects limit parameter", () => {
    const s = createSession();
    addMessageToSession(s, "user", "find my dashboard one");
    addMessageToSession(s, "user", "find my dashboard two");
    addMessageToSession(s, "user", "find my dashboard three");
    const { result } = renderHook(() =>
      useInputSuggestions("dashboard", [s], 2),
    );
    expect(result.current).toHaveLength(2);
    expect(
      result.current.every((line) => line.toLowerCase().includes("dashboard")),
    ).toBe(true);
  });

  it("skips messages shorter than 5 chars or longer than 200 chars", () => {
    const s = createSession();
    addMessageToSession(s, "user", "hi");
    addMessageToSession(s, "user", "x".repeat(201));
    addMessageToSession(s, "user", "valid match for needle text");
    const { result } = renderHook(() =>
      useInputSuggestions("needle", [s], 5),
    );
    expect(result.current).toEqual(["valid match for needle text"]);
  });

  it("only matches user role messages", () => {
    const s = createSession();
    addMessageToSession(s, "assistant", "assistant says needle here");
    addMessageToSession(s, "user", "user says needle here");
    const { result } = renderHook(() =>
      useInputSuggestions("needle", [s], 5),
    );
    expect(result.current).toEqual(["user says needle here"]);
  });
});
