import { openDB, type IDBPDatabase } from "idb";

export interface SequenceStep {
  message: string;
  waitForDone: boolean;
}

export interface Sequence {
  id: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  params?: Array<{ key: string; label: string; defaultValue?: string }>;
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "minion-chat-sequences";
const DB_VERSION = 1;
const STORE_NAME = "sequences";

interface SeqDB {
  sequences: { key: string; value: Sequence };
}

let dbPromise: Promise<IDBPDatabase<SeqDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SeqDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SeqDB>(DB_NAME, DB_VERSION, {
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

export async function loadSequences(): Promise<Sequence[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveSequence(seq: Sequence): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, seq);
}

export async function deleteSequence(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export function createSequenceId(): string {
  return `seq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function resolveSequenceStep(
  step: SequenceStep,
  params: Record<string, string>,
): string {
  let result = step.message;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}
