import {
  FileTextOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  ApartmentOutlined,
  GiftOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import type { ComponentType } from "react";
import type { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";

export interface QuickAction {
  key: string;
  icon: ComponentType<AntdIconProps>;
  labelKey: string;
  text: string;
}

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    key: "query-esystem",
    icon: SearchOutlined,
    labelKey: "queryEsystem",
    text: "查询 E-system ",
  },
  {
    key: "query-artifex",
    icon: PictureOutlined,
    labelKey: "queryArtifex",
    text: "在 Artifex 查询 ",
  },
  {
    key: "query-box",
    icon: FileTextOutlined,
    labelKey: "queryBox",
    text: "在 G123 Box 搜索 ",
  },
  {
    key: "query-adnext",
    icon: ThunderboltOutlined,
    labelKey: "queryAdnext",
    text: "查询 Adnext ",
  },
  {
    key: "query-gift",
    icon: GiftOutlined,
    labelKey: "queryGift",
    text: "查询 Gift ",
  },
  {
    key: "check-pipeline",
    icon: ApartmentOutlined,
    labelKey: "checkPipeline",
    text: "检查跨系统链路 ",
  },
];
