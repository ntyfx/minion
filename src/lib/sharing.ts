import type { Session, ChatMessage } from "@/types/chat";
import { downloadBlob } from "@/lib/download";
import { generateMessageId } from "@/lib/sessions";

export interface SharedSession {
  version: 1;
  label: string;
  tags: string[];
  messages: Array<{
    role: ChatMessage["role"];
    content: string;
    timestamp: string;
  }>;
  exportedAt: string;
}

export function sessionToShareable(session: Session): SharedSession {
  return {
    version: 1,
    label: session.label,
    tags: session.tags ?? [],
    messages: session.messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    exportedAt: new Date().toISOString(),
  };
}

export function shareableToSession(shared: SharedSession, newId: string): Session {
  return {
    id: newId,
    label: `[Shared] ${shared.label}`,
    tags: shared.tags,
    messages: shared.messages.map((m) => ({
      id: generateMessageId(),
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).getTime(),
    })),
    activity: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function downloadShareFile(session: Session) {
  const data = sessionToShareable(session);
  const json = JSON.stringify(data, null, 2);
  const filename = `${session.label.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}.minion`;
  downloadBlob(json, filename, "application/json");
}

export async function readShareFile(file: File): Promise<SharedSession> {
  const text = await file.text();
  const data = JSON.parse(text);
  if (data.version !== 1 || !Array.isArray(data.messages)) {
    throw new Error("Invalid .minion file format");
  }
  return data as SharedSession;
}

export const BUILTIN_TEMPLATES = [
  {
    name: "查询项目 Campaign",
    nameEn: "Query Project Campaigns",
    content: "查询 {appId} 在 System D 的 campaign 列表",
    category: "system-d",
    params: [{ key: "appId", label: "App ID" }],
  },
  {
    name: "查询素材库",
    nameEn: "Search Assets",
    content: "在 System C 中搜索 {appId} 的广告素材",
    category: "system-c",
    params: [{ key: "appId", label: "App ID" }],
  },
  {
    name: "查询礼包列表",
    nameEn: "Query Product Packs",
    content: "查询 System E 中 {appId} 的礼包列表",
    category: "system-e",
    params: [{ key: "appId", label: "App ID" }],
  },
  {
    name: "投放链路检查",
    nameEn: "Ad Pipeline Check",
    content: "帮我检查 {appId} 从 System B 到 System D 的广告素材投放链路",
    category: "cross-system",
    params: [{ key: "appId", label: "App ID" }],
  },
  {
    name: "创建投放计划",
    nameEn: "Create Ad Campaign Plan",
    content: "帮我规划一条为 {appId} 在 {channel} 的广告投放计划",
    category: "system-d",
    params: [
      { key: "appId", label: "App ID" },
      { key: "channel", label: "Channel" },
    ],
  },
  {
    name: "素材归档追溯",
    nameEn: "Asset Archive Trace",
    content: "帮我追溯 {assetName} 在 System A、System C、System D 中的状态",
    category: "cross-system",
    params: [{ key: "assetName", label: "Asset Name" }],
  },
] as const;
