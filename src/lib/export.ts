import type { Session, ChatMessage } from "@/types/chat";
import { downloadBlob } from "@/lib/download";

function messageToMarkdown(msg: ChatMessage): string {
  const roleLabel = msg.role === "user" ? "**You**" : msg.role === "assistant" ? "**Assistant**" : `**${msg.role}**`;
  const time = new Date(msg.timestamp).toLocaleString();
  return `### ${roleLabel} — ${time}\n\n${msg.content}\n`;
}

export function exportAsMarkdown(
  session: Session,
  filter: "all" | "assistant" = "all",
): string {
  const header = `# ${session.label}\n\nExported: ${new Date().toLocaleString()}\n\n---\n\n`;
  const msgs =
    filter === "assistant"
      ? session.messages.filter((m) => m.role === "assistant")
      : session.messages.filter((m) => m.role === "user" || m.role === "assistant");
  return header + msgs.map(messageToMarkdown).join("\n---\n\n");
}

export function exportAsJson(session: Session): string {
  const payload = {
    id: session.id,
    label: session.label,
    tags: session.tags ?? [],
    exportedAt: new Date().toISOString(),
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: new Date(m.timestamp).toISOString(),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function exportAsHtml(session: Session): string {
  const escapedLabel = session.label
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;");

  const messages = session.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const escaped = m.content
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/\n/g, "<br>");
      const cls = m.role === "user" ? "user" : "assistant";
      const label = m.role === "user" ? "You" : "Assistant";
      return `<div class="msg ${cls}"><div class="role">${label}</div><div class="content">${escaped}</div></div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapedLabel} — Minion Chat Export</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;background:#fafafa;color:#111}
  h1{font-size:1.3em;border-bottom:1px solid #ddd;padding-bottom:8px}
  .msg{margin:16px 0;padding:12px 16px;border-radius:10px;line-height:1.6}
  .user{background:#e8f5e9;border:1px solid #c8e6c9}
  .assistant{background:#fff;border:1px solid #e0e0e0}
  .role{font-weight:600;font-size:12px;color:#666;margin-bottom:4px}
  .content{font-size:14px;white-space:pre-wrap;word-break:break-word}
  .meta{font-size:12px;color:#999;margin-top:24px;text-align:center}
</style>
</head>
<body>
<h1>${escapedLabel}</h1>
${messages}
<p class="meta">Exported from Minion Chat · ${new Date().toLocaleString()}</p>
</body>
</html>`;
}

export function downloadMarkdown(session: Session, filter?: "all" | "assistant") {
  const content = exportAsMarkdown(session, filter);
  downloadBlob(content, `${session.label}.md`, "text/markdown");
}

export function downloadJson(session: Session) {
  const content = exportAsJson(session);
  downloadBlob(content, `${session.label}.json`, "application/json");
}

export function downloadHtml(session: Session) {
  const content = exportAsHtml(session);
  downloadBlob(content, `${session.label}.html`, "text/html");
}
