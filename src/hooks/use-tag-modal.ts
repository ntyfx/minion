"use client";

import { useState, useCallback } from "react";
import { useMemoizedFn } from "ahooks";
import type { Session } from "@/types/chat";

interface UseTagModalOptions {
  sessions: Session[];
  updateSession: (id: string, updater: (s: Session) => Session) => void;
}

interface UseTagModalReturn {
  tagModalOpen: boolean;
  tagSessionId: string | null;
  tagInput: string;
  setTagInput: (value: string) => void;
  setTagModalOpen: (open: boolean) => void;
  handleTagSession: (id: string) => void;
  handleTagConfirm: () => void;
  handleTagCancel: () => void;
}

export function useTagModal({ sessions, updateSession }: UseTagModalOptions): UseTagModalReturn {
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagSessionId, setTagSessionId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");

  const handleTagSession = useMemoizedFn((id: string) => {
    setTagSessionId(id);
    const s = sessions.find((s) => s.id === id);
    setTagInput((s?.tags ?? []).join(", "));
    setTagModalOpen(true);
  });

  const handleTagConfirm = useMemoizedFn(() => {
    if (!tagSessionId) return;
    const tags = tagInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    updateSession(tagSessionId, (s) => ({ ...s, tags }));
    setTagModalOpen(false);
    setTagSessionId(null);
  });

  const handleTagCancel = useCallback(() => {
    setTagModalOpen(false);
    setTagSessionId(null);
    setTagInput("");
  }, []);

  return {
    tagModalOpen,
    tagSessionId,
    tagInput,
    setTagInput,
    setTagModalOpen,
    handleTagSession,
    handleTagConfirm,
    handleTagCancel,
  };
}
