export interface SlashCommand {
  key: string;
  labelKey: string;
  descKey: string;
  prefix?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { key: "query", labelKey: "cmdQuery", descKey: "cmdQueryDesc", prefix: "查询 " },
  { key: "plan", labelKey: "cmdPlan", descKey: "cmdPlanDesc", prefix: "帮我规划 " },
  { key: "approve", labelKey: "cmdApprove", descKey: "cmdApproveDesc", prefix: "确认执行以上计划" },
  { key: "execute", labelKey: "cmdExecute", descKey: "cmdExecuteDesc", prefix: "帮我执行 " },
  { key: "check", labelKey: "cmdCheck", descKey: "cmdCheckDesc", prefix: "帮我检查 " },
  { key: "help", labelKey: "cmdHelp", descKey: "cmdHelpDesc" },
];

export const SYSTEM_NAMES = [
  "E-system",
  "Artifex",
  "G123 Box",
  "Adnext",
  "Gift",
  "B-system",
] as const;

export type SystemName = (typeof SYSTEM_NAMES)[number];

export function matchSlashCommands(input: string): SlashCommand[] {
  if (!input.startsWith("/")) return [];
  const query = input.slice(1).toLowerCase();
  if (!query) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.key.startsWith(query) ||
      cmd.labelKey.toLowerCase().includes(query),
  );
}

export function matchSystemNames(input: string): string[] {
  const atIdx = input.lastIndexOf("@");
  if (atIdx === -1) return [];
  const query = input.slice(atIdx + 1).toLowerCase();
  return SYSTEM_NAMES.filter((name) =>
    name.toLowerCase().includes(query),
  );
}

export function resolveSlashCommand(
  cmd: SlashCommand,
): { text: string; send: boolean } {
  if (cmd.key === "approve") {
    return { text: cmd.prefix ?? "", send: true };
  }
  if (cmd.key === "help") {
    return { text: "", send: false };
  }
  return { text: cmd.prefix ?? "", send: false };
}

export function applySystemMention(input: string, system: string): string {
  const atIdx = input.lastIndexOf("@");
  if (atIdx === -1) return input + system;
  return input.slice(0, atIdx) + system + " ";
}
