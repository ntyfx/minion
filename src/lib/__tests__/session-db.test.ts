import { describe, it, expect, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  dbLoadSessions,
  dbSaveSessions,
  dbSaveSession,
  dbDeleteSession,
  migrateFromLocalStorage,
  migrateSessionEnv,
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

describe("migrateSessionEnv", () => {
  it("backfills env on sessions that lack it", async () => {
    const s1 = createSession("No Env");
    const s2 = createSession("Also No Env");
    await dbSaveSessions([s1, s2]);

    const count = await migrateSessionEnv("staging");
    expect(count).toBe(2);

    const loaded = await dbLoadSessions();
    for (const s of loaded) {
      expect(s.env).toBe("staging");
    }
  });

  it("skips sessions that already have env", async () => {
    const s1 = createSession("Has Env", undefined, "prod");
    const s2 = createSession("No Env");
    await dbSaveSessions([s1, s2]);

    const count = await migrateSessionEnv("local");
    expect(count).toBe(1);

    const loaded = await dbLoadSessions();
    const withProd = loaded.find((s) => s.label === "Has Env");
    const withLocal = loaded.find((s) => s.label === "No Env");
    expect(withProd?.env).toBe("prod");
    expect(withLocal?.env).toBe("local");
  });

  it("only runs once (idempotent via localStorage flag)", async () => {
    await dbSaveSessions([createSession("A")]);

    const first = await migrateSessionEnv("staging");
    expect(first).toBe(1);

    // Reset DB, add a new session without env
    await _closeDB();
    await deleteDB("minion-chat");
    // Re-init DB
    await dbSaveSessions([createSession("B")]);

    const second = await migrateSessionEnv("prod");
    expect(second).toBe(0); // skipped because flag is set
  });

  it("returns 0 when all sessions already have env", async () => {
    const s = createSession("Done", undefined, "prod");
    await dbSaveSessions([s]);
    const count = await migrateSessionEnv("local");
    expect(count).toBe(0);
  });
});
