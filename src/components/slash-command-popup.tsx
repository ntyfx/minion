"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import {
  SearchOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  BulbOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { SlashCommand } from "@/lib/slash-commands";

interface SlashCommandPopupProps {
  commands: SlashCommand[];
  selectedIndex: number;
  onSelect: (cmd: SlashCommand) => void;
}

const CMD_ICONS: Record<string, React.ReactNode> = {
  query: <SearchOutlined />,
  plan: <BulbOutlined />,
  approve: <CheckCircleOutlined />,
  execute: <PlayCircleOutlined />,
  check: <ApartmentOutlined />,
  help: <QuestionCircleOutlined />,
};

export const SlashCommandPopup = memo(function SlashCommandPopup({
  commands,
  selectedIndex,
  onSelect,
}: SlashCommandPopupProps) {
  const t = useTranslations("slashCommands");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleClick = useCallback(
    (cmd: SlashCommand) => (e: React.MouseEvent) => {
      e.preventDefault();
      onSelect(cmd);
    },
    [onSelect],
  );

  if (commands.length === 0) return null;

  return (
    <div className="slash-popup" role="listbox">
      <div ref={listRef}>
        {commands.map((cmd, i) => (
          <button
            key={cmd.key}
            role="option"
            aria-selected={i === selectedIndex}
            className={`slash-popup-item${i === selectedIndex ? " slash-popup-item-active" : ""}`}
            onMouseDown={handleClick(cmd)}
          >
            <span className="slash-popup-icon">{CMD_ICONS[cmd.key] ?? <ThunderboltOutlined />}</span>
            <span className="slash-popup-text">
              <span className="slash-popup-label">/{cmd.key}</span>
              <span className="slash-popup-desc">{t(cmd.descKey)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
});

interface SystemMentionPopupProps {
  systems: string[];
  selectedIndex: number;
  onSelect: (system: string) => void;
}

export const SystemMentionPopup = memo(function SystemMentionPopup({
  systems,
  selectedIndex,
  onSelect,
}: SystemMentionPopupProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleClick = useCallback(
    (sys: string) => (e: React.MouseEvent) => {
      e.preventDefault();
      onSelect(sys);
    },
    [onSelect],
  );

  if (systems.length === 0) return null;

  return (
    <div className="slash-popup" role="listbox">
      <div ref={listRef}>
        {systems.map((sys, i) => (
          <button
            key={sys}
            role="option"
            aria-selected={i === selectedIndex}
            className={`slash-popup-item${i === selectedIndex ? " slash-popup-item-active" : ""}`}
            onMouseDown={handleClick(sys)}
          >
            <span className="slash-popup-icon">@</span>
            <span className="slash-popup-label">{sys}</span>
          </button>
        ))}
      </div>
    </div>
  );
});
