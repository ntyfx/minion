import { describe, it, expect } from "vitest";
import {
  SLASH_COMMANDS,
  matchSlashCommands,
  matchSystemNames,
  resolveSlashCommand,
  applySystemMention,
} from "@/lib/slash-commands";

describe("matchSlashCommands", () => {
  it("returns [] for input that does not start with /", () => {
    expect(matchSlashCommands("hello")).toEqual([]);
    expect(matchSlashCommands("query")).toEqual([]);
  });

  it("returns all commands for bare /", () => {
    expect(matchSlashCommands("/")).toEqual(SLASH_COMMANDS);
  });

  it("filters by prefix for /q, /pl, etc.", () => {
    const q = matchSlashCommands("/q");
    expect(q.map((c) => c.key)).toContain("query");

    const pl = matchSlashCommands("/pl");
    expect(pl.map((c) => c.key)).toContain("plan");
    expect(pl.every((c) => c.key.startsWith("pl") || c.labelKey.toLowerCase().includes("pl"))).toBe(
      true,
    );
  });
});

describe("matchSystemNames", () => {
  it("returns [] when there is no @", () => {
    expect(matchSystemNames("hello world")).toEqual([]);
  });

  it("returns matching systems for @E, @art, case insensitive", () => {
    expect(matchSystemNames("ping @e")).toEqual(expect.arrayContaining(["E-system"]));
    expect(matchSystemNames("pick @art")).toEqual(expect.arrayContaining(["Artifex"]));
    expect(matchSystemNames("Mixed @ADNEXT")).toEqual(expect.arrayContaining(["Adnext"]));
  });
});

describe("resolveSlashCommand", () => {
  it("approve returns send true with prefix text", () => {
    const approve = SLASH_COMMANDS.find((c) => c.key === "approve")!;
    expect(resolveSlashCommand(approve)).toEqual({
      text: "确认执行以上计划",
      send: true,
    });
  });

  it("help returns send false and empty text", () => {
    const help = SLASH_COMMANDS.find((c) => c.key === "help")!;
    expect(resolveSlashCommand(help)).toEqual({ text: "", send: false });
  });

  it("other commands return send false and prefix text", () => {
    const query = SLASH_COMMANDS.find((c) => c.key === "query")!;
    expect(resolveSlashCommand(query)).toEqual({
      text: "查询 ",
      send: false,
    });
    const plan = SLASH_COMMANDS.find((c) => c.key === "plan")!;
    expect(resolveSlashCommand(plan)).toEqual({
      text: "帮我规划 ",
      send: false,
    });
  });
});

describe("applySystemMention", () => {
  it("replaces from @ through end of string with system plus trailing space", () => {
    expect(applySystemMention("Ask @", "E-system")).toBe("Ask E-system ");
    expect(applySystemMention("prefix @partial", "Artifex")).toBe("prefix Artifex ");
  });

  it("appends system when there is no @", () => {
    expect(applySystemMention("hello ", "Gift")).toBe("hello Gift");
  });
});
