"use client";

import { useState } from "react";
import { useMemoizedFn } from "ahooks";
import type { Session } from "@/types/chat";
import { DEFAULT_CHAT_ICON } from "@/lib/chat-icons";

interface UseRenameModalOptions {
  sessions: Session[];
  updateSession: (id: string, updater: (s: Session) => Session) => void;
}

export function useRenameModal({ sessions, updateSession }: UseRenameModalOptions) {
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [iconValue, setIconValue] = useState<string>(DEFAULT_CHAT_ICON);

  const handleRenameSession = useMemoizedFn((id: string) => {
    const s = sessions.find((s) => s.id === id);
    if (!s) return;
    setRenameTarget(id);
    setRenameValue(s.label);
    setIconValue(s.icon || DEFAULT_CHAT_ICON);
    setRenameModalOpen(true);
  });

  const handleRenameConfirm = useMemoizedFn(() => {
    if (renameTarget && renameValue.trim()) {
      updateSession(renameTarget, (s) => ({
        ...s,
        label: renameValue.trim(),
        icon: iconValue,
      }));
    }
    setRenameModalOpen(false);
    setRenameTarget(null);
  });

  const handleRenameCancel = useMemoizedFn(() => {
    setRenameModalOpen(false);
    setRenameTarget(null);
  });

  return {
    renameModalOpen,
    renameValue,
    setRenameValue,
    iconValue,
    setIconValue,
    handleRenameSession,
    handleRenameConfirm,
    handleRenameCancel,
  };
}
