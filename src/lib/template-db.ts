import { openDB, type IDBPDatabase } from "idb";

export interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  category?: string;
  params?: Array<{ key: string; label: string; defaultValue?: string }>;
  useCount: number;
  createdAt: number;
  updatedAt: number;
}

const DB_NAME = "minion-chat-templates";
const DB_VERSION = 1;
const STORE_NAME = "templates";

interface TemplateDB {
  templates: {
    key: string;
    value: PromptTemplate;
  };
}

let dbPromise: Promise<IDBPDatabase<TemplateDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TemplateDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TemplateDB>(DB_NAME, DB_VERSION, {
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

export async function loadTemplates(): Promise<PromptTemplate[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveTemplate(
  template: PromptTemplate,
): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, template);
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function incrementTemplateUse(id: string): Promise<void> {
  const db = await getDB();
  const tmpl = await db.get(STORE_NAME, id);
  if (tmpl) {
    tmpl.useCount++;
    tmpl.updatedAt = Date.now();
    await db.put(STORE_NAME, tmpl);
  }
}

export function createTemplateId(): string {
  return `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function resolveTemplate(
  template: PromptTemplate,
  params: Record<string, string>,
): string {
  let result = template.content;
  for (const p of template.params ?? []) {
    const value = params[p.key] ?? p.defaultValue ?? "";
    result = result.replace(new RegExp(`\\{${p.key}\\}`, "g"), value);
  }
  return result;
}
