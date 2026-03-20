import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { describe, it, expect, beforeEach } from "vitest";
import type { PromptTemplate } from "@/lib/template-db";
import {
  loadTemplates,
  saveTemplate,
  deleteTemplate,
  incrementTemplateUse,
  createTemplateId,
  resolveTemplate,
  _closeDB,
} from "@/lib/template-db";

const DB_NAME = "minion-chat-templates";

beforeEach(async () => {
  await _closeDB();
  await deleteDB(DB_NAME);
});

function sampleTemplate(id: string, overrides: Partial<PromptTemplate> = {}): PromptTemplate {
  return {
    id,
    name: "N",
    content: "Hello {name}",
    category: "c",
    params: [{ key: "name", label: "Name", defaultValue: "World" }],
    useCount: 0,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("template-db", () => {
  it("loadTemplates returns empty array initially", async () => {
    expect(await loadTemplates()).toEqual([]);
  });

  it("saveTemplate + loadTemplates round-trips", async () => {
    const t = sampleTemplate(createTemplateId());
    await saveTemplate(t);
    const loaded = await loadTemplates();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(t);
  });

  it("deleteTemplate removes the correct item", async () => {
    const a = createTemplateId();
    const b = createTemplateId();
    await saveTemplate(sampleTemplate(a));
    await saveTemplate(sampleTemplate(b));
    await deleteTemplate(a);
    const loaded = await loadTemplates();
    expect(loaded.map((x) => x.id)).toEqual([b]);
  });

  it("incrementTemplateUse increases useCount", async () => {
    const id = createTemplateId();
    await saveTemplate(sampleTemplate(id, { useCount: 3, updatedAt: 100 }));
    const before = Date.now();
    await incrementTemplateUse(id);
    const loaded = await loadTemplates();
    expect(loaded[0].useCount).toBe(4);
    expect(loaded[0].updatedAt).toBeGreaterThanOrEqual(before);
  });

  it("createTemplateId produces unique IDs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = createTemplateId();
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });

  it("resolveTemplate replaces {key} placeholders", () => {
    const t = sampleTemplate("x", {
      content: "App {appId} on {appId} and {missing}",
      params: [
        { key: "appId", label: "App" },
        { key: "missing", label: "M", defaultValue: "DEF" },
      ],
    });
    expect(resolveTemplate(t, { appId: "123" })).toBe("App 123 on 123 and DEF");
    expect(resolveTemplate(t, { appId: "123", missing: "X" })).toBe("App 123 on 123 and X");
  });
});
