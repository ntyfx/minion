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
    key: "query-system-a",
    icon: SearchOutlined,
    labelKey: "querySystemA",
    text: "查询 System A ",
  },
  {
    key: "query-system-b",
    icon: PictureOutlined,
    labelKey: "querySystemB",
    text: "在 System B 查询 ",
  },
  {
    key: "query-system-c",
    icon: FileTextOutlined,
    labelKey: "querySystemC",
    text: "在 System C 搜索 ",
  },
  {
    key: "query-system-d",
    icon: ThunderboltOutlined,
    labelKey: "querySystemD",
    text: "查询 System D ",
  },
  {
    key: "query-system-e",
    icon: GiftOutlined,
    labelKey: "querySystemE",
    text: "查询 System E ",
  },
  {
    key: "check-pipeline",
    icon: ApartmentOutlined,
    labelKey: "checkPipeline",
    text: "检查跨系统链路 ",
  },
];
