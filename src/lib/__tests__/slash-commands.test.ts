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

  it("returns matching systems for @A, @B, case insensitive", () => {
    expect(matchSystemNames("ping @a")).toEqual(expect.arrayContaining(["System A"]));
    expect(matchSystemNames("pick @b")).toEqual(expect.arrayContaining(["System B"]));
    expect(matchSystemNames("Mixed @D")).toEqual(expect.arrayContaining(["System D"]));
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
    expect(applySystemMention("Ask @", "System A")).toBe("Ask System A ");
    expect(applySystemMention("prefix @partial", "System B")).toBe("prefix System B ");
  });

  it("appends system when there is no @", () => {
    expect(applySystemMention("hello ", "System E")).toBe("hello System E");
  });
});
