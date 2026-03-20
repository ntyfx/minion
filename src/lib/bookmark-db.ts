import { openDB, type IDBPDatabase } from "idb";

export interface Bookmark {
  id: string;
  content: string;
  role: string;
  tags: string[];
  sessionId: string;
  sessionLabel: string;
  messageId: string;
  note?: string;
  createdAt: number;
}

const DB_NAME = "minion-chat-bookmarks";
const DB_VERSION = 1;
const STORE_NAME = "bookmarks";

interface BookmarkDB {
  bookmarks: {
    key: string;
    value: Bookmark;
  };
}

let dbPromise: Promise<IDBPDatabase<BookmarkDB>> | null = null;

function getDB(): Promise<IDBPDatabase<BookmarkDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BookmarkDB>(DB_NAME, DB_VERSION, {
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

export async function loadBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put(STORE_NAME, bookmark);
}

export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export function createBookmarkId(): string {
  return `bm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
