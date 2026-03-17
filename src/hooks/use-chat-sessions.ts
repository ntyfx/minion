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

export function useChatSessions() {
  const [sessions, setSessions] = useState<Session[]>(() => loadSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    () => loadActiveSessionId(),
  );

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

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

  useEffect(() => {
    if (sessions.length === 0) {
      handleCreateSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
