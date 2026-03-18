export type ThemeId =
  | "light"
  | "dark"
  | "premium-dark"
  | "latte"
  | "dusk"
  | "dawn"
  | "china-red";

export type ColorScheme = "light" | "dark";

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  colorScheme: ColorScheme;
  preview: { bg: string; accent: string; text: string };
}

export interface AntdThemeTokens {
  colorPrimary: string;
  colorBgContainer: string;
  colorBgElevated: string;
  colorBgLayout: string;
  colorBorder: string;
  colorBorderSecondary: string;
  colorText: string;
  colorTextSecondary: string;
  colorTextTertiary: string;
}

export interface AntdComponentOverrides {
  headerBg: string;
  rowHoverBg: string;
  inputHoverBorder: string;
  tooltipBg: string;
}

export interface ThemeDefinition {
  meta: ThemeMeta;
  antdTokens: AntdThemeTokens;
  antdOverrides: AntdComponentOverrides;
}

const THEMES: Record<ThemeId, ThemeDefinition> = {
  light: {
    meta: {
      id: "light",
      label: "Light",
      colorScheme: "light",
      preview: { bg: "#ffffff", accent: "#10b981", text: "#111827" },
    },
    antdTokens: {
      colorPrimary: "#10b981",
      colorBgContainer: "#ffffff",
      colorBgElevated: "#ffffff",
      colorBgLayout: "#f8f9fa",
      colorBorder: "#e5e7eb",
      colorBorderSecondary: "#f3f4f6",
      colorText: "#111827",
      colorTextSecondary: "#6b7280",
      colorTextTertiary: "#9ca3af",
    },
    antdOverrides: {
      headerBg: "#f8f9fa",
      rowHoverBg: "rgba(16, 185, 129, 0.04)",
      inputHoverBorder: "rgba(16, 185, 129, 0.4)",
      tooltipBg: "#111827",
    },
  },

  dark: {
    meta: {
      id: "dark",
      label: "Dark",
      colorScheme: "dark",
      preview: { bg: "#0a0a0b", accent: "#34d399", text: "#e5e5e5" },
    },
    antdTokens: {
      colorPrimary: "#34d399",
      colorBgContainer: "#111113",
      colorBgElevated: "#1a1a1e",
      colorBgLayout: "#0a0a0b",
      colorBorder: "#27272a",
      colorBorderSecondary: "#1f1f23",
      colorText: "#e5e5e5",
      colorTextSecondary: "#a1a1aa",
      colorTextTertiary: "#52525b",
    },
    antdOverrides: {
      headerBg: "#1a1a1e",
      rowHoverBg: "rgba(52, 211, 153, 0.04)",
      inputHoverBorder: "rgba(52, 211, 153, 0.3)",
      tooltipBg: "#27272a",
    },
  },

  "premium-dark": {
    meta: {
      id: "premium-dark",
      label: "高级黑",
      colorScheme: "dark",
      preview: { bg: "#000000", accent: "#CA8A04", text: "#F0F0F0" },
    },
    antdTokens: {
      colorPrimary: "#CA8A04",
      colorBgContainer: "#0A0A0A",
      colorBgElevated: "#141414",
      colorBgLayout: "#000000",
      colorBorder: "#1C1917",
      colorBorderSecondary: "#151310",
      colorText: "#F0F0F0",
      colorTextSecondary: "#A8A29E",
      colorTextTertiary: "#57534E",
    },
    antdOverrides: {
      headerBg: "#141414",
      rowHoverBg: "rgba(202, 138, 4, 0.04)",
      inputHoverBorder: "rgba(202, 138, 4, 0.35)",
      tooltipBg: "#1C1917",
    },
  },

  latte: {
    meta: {
      id: "latte",
      label: "馥芮白",
      colorScheme: "light",
      preview: { bg: "#FAF8F5", accent: "#A0826D", text: "#3D2E2A" },
    },
    antdTokens: {
      colorPrimary: "#A0826D",
      colorBgContainer: "#FAF8F5",
      colorBgElevated: "#FEFDFB",
      colorBgLayout: "#F4F0EB",
      colorBorder: "#E6DDD4",
      colorBorderSecondary: "#EDE6DE",
      colorText: "#3D2E2A",
      colorTextSecondary: "#7A6A5E",
      colorTextTertiary: "#A89E94",
    },
    antdOverrides: {
      headerBg: "#F4F0EB",
      rowHoverBg: "rgba(160, 130, 109, 0.04)",
      inputHoverBorder: "rgba(160, 130, 109, 0.35)",
      tooltipBg: "#3D2E2A",
    },
  },

  dusk: {
    meta: {
      id: "dusk",
      label: "黄昏",
      colorScheme: "dark",
      preview: { bg: "#1a1425", accent: "#f0a060", text: "#e8ddd0" },
    },
    antdTokens: {
      colorPrimary: "#f0a060",
      colorBgContainer: "#1e1828",
      colorBgElevated: "#261f32",
      colorBgLayout: "#1a1425",
      colorBorder: "#332b42",
      colorBorderSecondary: "#2a2338",
      colorText: "#e8ddd0",
      colorTextSecondary: "#a89a8c",
      colorTextTertiary: "#5e5470",
    },
    antdOverrides: {
      headerBg: "#261f32",
      rowHoverBg: "rgba(240, 160, 96, 0.04)",
      inputHoverBorder: "rgba(240, 160, 96, 0.3)",
      tooltipBg: "#332b42",
    },
  },

  dawn: {
    meta: {
      id: "dawn",
      label: "清晨",
      colorScheme: "light",
      preview: { bg: "#f8fbff", accent: "#5b9bd5", text: "#1e3a5f" },
    },
    antdTokens: {
      colorPrimary: "#5b9bd5",
      colorBgContainer: "#f8fbff",
      colorBgElevated: "#ffffff",
      colorBgLayout: "#f0f5fc",
      colorBorder: "#d4e2f4",
      colorBorderSecondary: "#e4edf8",
      colorText: "#1e3a5f",
      colorTextSecondary: "#5a7a9e",
      colorTextTertiary: "#8eaac4",
    },
    antdOverrides: {
      headerBg: "#f0f5fc",
      rowHoverBg: "rgba(91, 155, 213, 0.04)",
      inputHoverBorder: "rgba(91, 155, 213, 0.4)",
      tooltipBg: "#1e3a5f",
    },
  },
  "china-red": {
    meta: {
      id: "china-red",
      label: "中国红",
      colorScheme: "dark",
      preview: { bg: "#1C1410", accent: "#CC0000", text: "#FAF5F0" },
    },
    antdTokens: {
      colorPrimary: "#CC0000",
      colorBgContainer: "#251C17",
      colorBgElevated: "#302520",
      colorBgLayout: "#1C1410",
      colorBorder: "#4A3A30",
      colorBorderSecondary: "#3C2E26",
      colorText: "#FAF5F0",
      colorTextSecondary: "#D4C4B0",
      colorTextTertiary: "#8C7A6A",
    },
    antdOverrides: {
      headerBg: "#302520",
      rowHoverBg: "rgba(204, 0, 0, 0.05)",
      inputHoverBorder: "rgba(204, 0, 0, 0.4)",
      tooltipBg: "#4A3A30",
    },
  },
};

export const THEME_LIST: ThemeMeta[] = Object.values(THEMES).map((t) => t.meta);

export function getThemeDefinition(id: ThemeId): ThemeDefinition {
  return THEMES[id] ?? THEMES.dark;
}

export function isValidThemeId(value: string): value is ThemeId {
  return value in THEMES;
}
