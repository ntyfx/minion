"use client";

import { useMemo } from "react";
import type { Session } from "@/types/chat";

export function getSessionSummary(session: Session): string {
  const summaryEvent = [...session.activity]
    .reverse()
    .find((e) => e.type === "summary");
  if (summaryEvent && typeof summaryEvent.payload === "string") {
    return summaryEvent.payload;
  }
  const firstAi = session.messages.find((m) => m.role === "assistant");
  if (firstAi) {
    return firstAi.content.slice(0, 120) + (firstAi.content.length > 120 ? "…" : "");
  }
  return "";
}

function extractKeywords(session: Session): string[] {
  const keywords = new Set<string>();
  for (const tag of session.tags ?? []) {
    keywords.add(tag.toLowerCase());
  }
  for (const msg of session.messages) {
    if (msg.role !== "user") continue;
    const words = msg.content
      .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);
    for (const w of words.slice(0, 20)) {
      keywords.add(w.toLowerCase());
    }
  }
  return [...keywords];
}

function sessionSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const setB = new Set(b);
  let matches = 0;
  for (const kw of a) {
    if (setB.has(kw)) matches++;
  }
  return matches / Math.max(a.length, b.length);
}

export function useRelatedSessions(
  currentSession: Session | null,
  allSessions: Session[],
  limit = 3,
): Session[] {
  return useMemo(() => {
    if (!currentSession || currentSession.messages.length === 0) return [];
    const currentKW = extractKeywords(currentSession);
    if (currentKW.length === 0) return [];

    return allSessions
      .filter((s) => s.id !== currentSession.id && !s.archived && s.messages.length > 0)
      .map((s) => ({ session: s, score: sessionSimilarity(currentKW, extractKeywords(s)) }))
      .filter((item) => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.session);
  }, [currentSession, allSessions, limit]);
}

export function useInputSuggestions(
  inputValue: string,
  allSessions: Session[],
  limit = 5,
): string[] {
  return useMemo(() => {
    if (inputValue.length < 3) return [];
    const q = inputValue.toLowerCase();
    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const s of allSessions) {
      for (const msg of s.messages) {
        if (msg.role !== "user") continue;
        const content = msg.content.trim();
        if (content.length < 5 || content.length > 200) continue;
        if (content.toLowerCase().includes(q) && !seen.has(content)) {
          seen.add(content);
          suggestions.push(content);
          if (suggestions.length >= limit) return suggestions;
        }
      }
    }

    return suggestions;
  }, [inputValue, allSessions, limit]);
}
