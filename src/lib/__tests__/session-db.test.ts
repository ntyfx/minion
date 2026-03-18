import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  dbLoadSessions,
  dbSaveSessions,
  dbSaveSession,
  dbDeleteSession,
  migrateFromLocalStorage,
  _closeDB,
} from "@/lib/session-db";
import { createSession } from "@/lib/sessions";
import { deleteDB } from "idb";

beforeEach(async () => {
  localStorage.clear();
  await _closeDB();
  await deleteDB("minion-chat");
});

describe("dbSaveSessions / dbLoadSessions", () => {
  it("returns empty array when nothing stored", async () => {
    const sessions = await dbLoadSessions();
    expect(sessions).toEqual([]);
  });

  it("round-trips sessions", async () => {
    const s1 = createSession("A");
    const s2 = createSession("B");
    await dbSaveSessions([s1, s2]);
    const loaded = await dbLoadSessions();
    expect(loaded).toHaveLength(2);
    const labels = loaded.map((s) => s.label).sort();
    expect(labels).toEqual(["A", "B"]);
  });

  it("overwrites previous sessions on save", async () => {
    await dbSaveSessions([createSession("Old")]);
    await dbSaveSessions([createSession("New")]);
    const loaded = await dbLoadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe("New");
  });
});

describe("dbSaveSession", () => {
  it("upserts a single session", async () => {
    const s = createSession("Single");
    await dbSaveSession(s);
    const loaded = await dbLoadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe("Single");
  });
});

describe("dbDeleteSession", () => {
  it("removes a session by id", async () => {
    const s1 = createSession("Keep");
    const s2 = createSession("Remove");
    await dbSaveSessions([s1, s2]);
    await dbDeleteSession(s2.id);
    const loaded = await dbLoadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe("Keep");
  });
});

describe("migrateFromLocalStorage", () => {
  it("migrates sessions from localStorage to IndexedDB", async () => {
    const s1 = createSession("Migrated");
    localStorage.setItem("minion-sessions", JSON.stringify([s1]));

    const migrated = await migrateFromLocalStorage();
    expect(migrated).toBe(true);
    expect(localStorage.getItem("minion-sessions")).toBeNull();

    const loaded = await dbLoadSessions();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].label).toBe("Migrated");
  });

  it("returns false when nothing to migrate", async () => {
    const migrated = await migrateFromLocalStorage();
    expect(migrated).toBe(false);
  });

  it("handles corrupted localStorage gracefully", async () => {
    localStorage.setItem("minion-sessions", "not-json{{{");
    const migrated = await migrateFromLocalStorage();
    expect(migrated).toBe(false);
    // corrupted data is kept so manual recovery is possible
    expect(localStorage.getItem("minion-sessions")).toBe("not-json{{{");
  });

  it("handles empty array in localStorage", async () => {
    localStorage.setItem("minion-sessions", "[]");
    const migrated = await migrateFromLocalStorage();
    expect(migrated).toBe(false);
    expect(localStorage.getItem("minion-sessions")).toBeNull();
  });
});
