import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadBookmarks,
  saveBookmark,
  deleteBookmark,
  createBookmarkId,
  _closeDB,
} from "@/lib/bookmark-db";

const DB_NAME = "minion-chat-bookmarks";

beforeEach(async () => {
  await _closeDB();
  await deleteDB(DB_NAME);
});

describe("bookmark-db", () => {
  it("loadBookmarks returns empty array initially", async () => {
    expect(await loadBookmarks()).toEqual([]);
  });

  it("saveBookmark + loadBookmarks round-trips", async () => {
    const bookmark = {
      id: createBookmarkId(),
      content: "note body",
      role: "assistant",
      tags: ["t1"],
      sessionId: "s1",
      sessionLabel: "S",
      messageId: "m1",
      note: "my note",
      createdAt: 1,
    };
    await saveBookmark(bookmark);
    const loaded = await loadBookmarks();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(bookmark);
  });

  it("deleteBookmark removes the correct item", async () => {
    const a = createBookmarkId();
    const b = createBookmarkId();
    const mk = (id: string) => ({
      id,
      content: "c",
      role: "user",
      tags: [] as string[],
      sessionId: "s",
      sessionLabel: "L",
      messageId: "m",
      createdAt: 0,
    });
    await saveBookmark(mk(a));
    await saveBookmark(mk(b));
    await deleteBookmark(a);
    const loaded = await loadBookmarks();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(b);
  });

  it("createBookmarkId produces unique IDs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = createBookmarkId();
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });
});
