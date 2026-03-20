"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useLatest, useMemoizedFn } from "ahooks";
import {
  loadActiveSessionId,
  saveActiveSessionId,
  createSession,
} from "@/lib/sessions";
import {
  dbLoadSessions,
  dbSaveSessions,
  migrateFromLocalStorage,
} from "@/lib/session-db";
import type { Session } from "@/types/chat";

export function useChatSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const sessionsRef = useLatest(sessions);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      await migrateFromLocalStorage();
      const loaded = await dbLoadSessions();
      const initial = loaded.length > 0 ? loaded : [createSession()];
      const activeId = loadActiveSessionId() ?? initial[0]?.id ?? null;

      setSessions(initial);
      setActiveSessionId(activeId);
      setReady(true);
    })();
  }, []);

  const activeSession =
    sessions.find((s) => s.id === activeSessionId) ?? null;

  useEffect(() => {
    if (!ready) return;
    dbSaveSessions(sessions).catch((err) =>
      console.error("[sessions] persist failed", err),
    );
  }, [sessions, ready]);

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

  const handleDeleteSession = useMemoizedFn((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (activeSessionId === id) {
      const remaining = sessionsRef.current.filter((s) => s.id !== id);
      setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  });

  return {
    sessions,
    setSessions,
    sessionsRef,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    loading: !ready,
    updateSession,
    handleCreateSession,
    handleSelectSession,
    handleDeleteSession,
  };
}
