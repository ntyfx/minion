"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  loadSessions,
  saveSessions,
  loadActiveSessionId,
  saveActiveSessionId,
  createSession,
} from "@/lib/sessions";
import type { Session } from "@/types/chat";

function loadInitialState() {
  const loaded = loadSessions();
  const sessions = loaded.length > 0 ? loaded : [createSession()];
  const activeId = loadActiveSessionId() ?? sessions[0]?.id ?? null;
  return { sessions, activeId };
}

export function useChatSessions() {
  const [initial] = useState(loadInitialState);
  const [sessions, setSessions] = useState<Session[]>(initial.sessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    initial.activeId,
  );

  const sessionsRef = useRef(sessions);
  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? null;

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (activeSessionId) saveActiveSessionId(activeSessionId);
  }, [activeSessionId]);

  const updateSession = useCallback(
    (id: string, updater: (s: Session) => Session) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? updater({ ...s }) : s)),
      );
    },
    [],
  );

  const handleCreateSession = useCallback(() => {
    const s = createSession();
    setSessions((prev) => [...prev, s]);
    setActiveSessionId(s.id);
    return s;
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
  }, []);

  const handleDeleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessionsRef.current.filter((s) => s.id !== id);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    },
    [activeSessionId],
  );

  return {
    sessions,
    setSessions,
    sessionsRef,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateSession,
    handleCreateSession,
    handleSelectSession,
    handleDeleteSession,
  };
}
