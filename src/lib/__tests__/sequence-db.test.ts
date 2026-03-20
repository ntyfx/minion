import "fake-indexeddb/auto";
import { deleteDB } from "idb";
import { describe, it, expect, beforeEach } from "vitest";
import type { Sequence } from "@/lib/sequence-db";
import {
  loadSequences,
  saveSequence,
  deleteSequence,
  createSequenceId,
  resolveSequenceStep,
  _closeDB,
} from "@/lib/sequence-db";

const DB_NAME = "minion-chat-sequences";

beforeEach(async () => {
  await _closeDB();
  await deleteDB(DB_NAME);
});

function sampleSequence(id: string): Sequence {
  return {
    id,
    name: "Seq",
    steps: [{ message: "Step {id}", waitForDone: false }],
    params: [{ key: "id", label: "ID" }],
    useCount: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}

describe("sequence-db", () => {
  it("loadSequences returns empty array initially", async () => {
    expect(await loadSequences()).toEqual([]);
  });

  it("saveSequence + loadSequences round-trips", async () => {
    const seq = sampleSequence(createSequenceId());
    await saveSequence(seq);
    const loaded = await loadSequences();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]).toEqual(seq);
  });

  it("deleteSequence removes the correct item", async () => {
    const a = createSequenceId();
    const b = createSequenceId();
    await saveSequence(sampleSequence(a));
    await saveSequence({ ...sampleSequence(b), name: "Other" });
    await deleteSequence(a);
    const loaded = await loadSequences();
    expect(loaded.map((x) => x.id)).toEqual([b]);
  });

  it("createSequenceId produces unique IDs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const id = createSequenceId();
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });

  it("resolveSequenceStep replaces {key} placeholders", () => {
    const step = { message: "Hello {who} — {who}", waitForDone: true };
    expect(resolveSequenceStep(step, { who: "Ada" })).toBe("Hello Ada — Ada");
  });
});
