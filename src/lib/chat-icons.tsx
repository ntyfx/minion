"use client";

import React from "react";
import {
  MessageOutlined,
  BulbOutlined,
  RocketOutlined,
  CodeOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
  StarOutlined,
  HeartOutlined,
  FireOutlined,
  TrophyOutlined,
  BookOutlined,
  CompassOutlined,
  CoffeeOutlined,
  SmileOutlined,
  SearchOutlined,
  ToolOutlined,
  GlobalOutlined,
  PictureOutlined,
  SoundOutlined,
  EditOutlined,
} from "@ant-design/icons";

export const CHAT_ICON_KEYS = [
  "MessageOutlined",
  "BulbOutlined",
  "RocketOutlined",
  "CodeOutlined",
  "ExperimentOutlined",
  "ThunderboltOutlined",
  "StarOutlined",
  "HeartOutlined",
  "FireOutlined",
  "TrophyOutlined",
  "BookOutlined",
  "CompassOutlined",
  "CoffeeOutlined",
  "SmileOutlined",
  "SearchOutlined",
  "ToolOutlined",
  "GlobalOutlined",
  "PictureOutlined",
  "SoundOutlined",
  "EditOutlined",
] as const;

export type ChatIconKey = (typeof CHAT_ICON_KEYS)[number];

export const DEFAULT_CHAT_ICON: ChatIconKey = "MessageOutlined";

const ICON_MAP: Record<ChatIconKey, React.ReactNode> = {
  MessageOutlined: <MessageOutlined />,
  BulbOutlined: <BulbOutlined />,
  RocketOutlined: <RocketOutlined />,
  CodeOutlined: <CodeOutlined />,
  ExperimentOutlined: <ExperimentOutlined />,
  ThunderboltOutlined: <ThunderboltOutlined />,
  StarOutlined: <StarOutlined />,
  HeartOutlined: <HeartOutlined />,
  FireOutlined: <FireOutlined />,
  TrophyOutlined: <TrophyOutlined />,
  BookOutlined: <BookOutlined />,
  CompassOutlined: <CompassOutlined />,
  CoffeeOutlined: <CoffeeOutlined />,
  SmileOutlined: <SmileOutlined />,
  SearchOutlined: <SearchOutlined />,
  ToolOutlined: <ToolOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  PictureOutlined: <PictureOutlined />,
  SoundOutlined: <SoundOutlined />,
  EditOutlined: <EditOutlined />,
};

export function getChatIcon(key?: string): React.ReactNode {
  if (key && key in ICON_MAP) return ICON_MAP[key as ChatIconKey];
  return ICON_MAP[DEFAULT_CHAT_ICON];
}
