import { openDB, type IDBPDatabase } from "idb";
import type { Session } from "@/types/chat";
import type { EnvType } from "@/lib/environment";

const DB_NAME = "minion-chat";
const DB_VERSION = 1;
const STORE_NAME = "sessions";
const LEGACY_STORAGE_KEY = "minion-sessions";

interface MinionChatDB {
  sessions: {
    key: string;
    value: Session;
  };
}

let dbPromise: Promise<IDBPDatabase<MinionChatDB>> | null = null;

function getDB(): Promise<IDBPDatabase<MinionChatDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MinionChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/** Close the cached connection and reset. Used by tests. */
export async function _closeDB(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
}

export async function dbLoadSessions(): Promise<Session[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function dbSaveSessions(sessions: Session[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await tx.store.clear();
  for (const session of sessions) {
    await tx.store.put(session);
  }
  await tx.done;
}

export async function dbSaveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, session);
}

export async function dbDeleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * One-time migration: move sessions from localStorage into IndexedDB.
 * Verifies data landed in IndexedDB before removing the localStorage copy.
 * Returns true if migration occurred.
 */
export async function migrateFromLocalStorage(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return false;

  try {
    const sessions: Session[] = JSON.parse(raw);
    if (!Array.isArray(sessions) || sessions.length === 0) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return false;
    }

    await dbSaveSessions(sessions);

    const persisted = await dbLoadSessions();
    if (persisted.length >= sessions.length) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return true;
  } catch {
    return false;
  }
}

const ENV_MIGRATED_KEY = "minion-env-migrated";

/**
 * One-time migration: backfill `env` on sessions that lack it.
 * Uses the provided env (derived from the current API Base URL).
 * Returns the number of sessions updated.
 */
export async function migrateSessionEnv(currentEnv: EnvType): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (localStorage.getItem(ENV_MIGRATED_KEY)) return 0;

  const sessions = await dbLoadSessions();
  let count = 0;
  const updated = sessions.map((s) => {
    if (s.env) return s;
    count++;
    return { ...s, env: currentEnv };
  });

  if (count === 0) {
    localStorage.setItem(ENV_MIGRATED_KEY, "1");
    return 0;
  }

  await dbSaveSessions(updated);
  localStorage.setItem(ENV_MIGRATED_KEY, "1");
  return count;
}

export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
