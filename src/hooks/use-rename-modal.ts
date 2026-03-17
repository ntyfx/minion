"use client";

import { useState, useCallback } from "react";
import type { Session } from "@/types/chat";

interface UseRenameModalOptions {
  sessions: Session[];
  updateSession: (id: string, updater: (s: Session) => Session) => void;
}

export function useRenameModal({ sessions, updateSession }: UseRenameModalOptions) {
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const handleRenameSession = useCallback(
    (id: string) => {
      const s = sessions.find((s) => s.id === id);
      if (!s) return;
      setRenameTarget(id);
      setRenameValue(s.label);
      setRenameModalOpen(true);
    },
    [sessions],
  );

  const handleRenameConfirm = useCallback(() => {
    if (renameTarget && renameValue.trim()) {
      updateSession(renameTarget, (s) => ({
        ...s,
        label: renameValue.trim(),
      }));
    }
    setRenameModalOpen(false);
    setRenameTarget(null);
  }, [renameTarget, renameValue, updateSession]);

  const handleRenameCancel = useCallback(() => {
    setRenameModalOpen(false);
    setRenameTarget(null);
  }, []);

  return {
    renameModalOpen,
    renameValue,
    setRenameValue,
    handleRenameSession,
    handleRenameConfirm,
    handleRenameCancel,
  };
}
