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

export interface SequenceExecutionRecord {
  id: string;
  sequenceId: string;
  sequenceName: string;
  startTime: number;
  endTime?: number;
  status: 'success' | 'error' | 'interrupted';
  steps: Array<{
    stepIndex: number;
    message: string;
    params?: Record<string, string>;
    executedAt: number;
  }>;
}

const DB_NAME = "minion-chat-sequences";
const DB_VERSION = 2;
const STORE_NAME = "sequences";
const EXECUTION_STORE_NAME = "sequence_executions";

interface SeqDB {
  sequences: { key: string; value: Sequence };
  sequence_executions: { key: string; value: SequenceExecutionRecord };
}

let dbPromise: Promise<IDBPDatabase<SeqDB>> | null = null;

function getDB(): Promise<IDBPDatabase<SeqDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SeqDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: "id" });
          }
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(EXECUTION_STORE_NAME)) {
            const store = db.createObjectStore(EXECUTION_STORE_NAME, { keyPath: "id" });
            store.createIndex("sequenceId", "sequenceId");
            store.createIndex("startTime", "startTime");
          }
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

export async function updateSequenceUseCount(id: string, delta: number): Promise<void> {
  const db = await getDB();
  const seq = await db.get(STORE_NAME, id);
  if (seq) {
    seq.useCount = Math.max(0, seq.useCount + delta);
    seq.updatedAt = Date.now();
    await db.put(STORE_NAME, seq);
  }
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
    // 转义正则特殊字符，防止参数中包含特殊字符导致问题
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    result = result.replace(new RegExp(`\\{${escapedKey}\\}`, "g"), value);
  }
  return result;
}

export async function saveExecutionRecord(record: SequenceExecutionRecord): Promise<void> {
  const db = await getDB();
  await db.put(EXECUTION_STORE_NAME, record);
}

export async function getExecutionRecords(limit = 20): Promise<SequenceExecutionRecord[]> {
  const db = await getDB();
  const records = await db.getAll(EXECUTION_STORE_NAME);
  return records.sort((a, b) => b.startTime - a.startTime).slice(0, limit);
}

export async function deleteExecutionRecord(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(EXECUTION_STORE_NAME, id);
}

export async function clearExecutionRecords(): Promise<void> {
  const db = await getDB();
  await db.clear(EXECUTION_STORE_NAME);
}
