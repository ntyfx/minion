"use client";

import { ConfigProvider, theme as antTheme } from "antd";
import { XProvider } from "@ant-design/x";
import { ThemeProvider, useTheme } from "@/lib/theme";
import ErrorBoundary from "@/components/error-boundary";

const LIGHT_TOKENS = {
  colorPrimary: "#10b981",
  colorBgContainer: "#ffffff",
  colorBgElevated: "#ffffff",
  colorBgLayout: "#f8f9fa",
  colorBorder: "#e5e7eb",
  colorBorderSecondary: "#f3f4f6",
  colorText: "#111827",
  colorTextSecondary: "#6b7280",
  colorTextTertiary: "#9ca3af",
};

const DARK_TOKENS = {
  colorPrimary: "#34d399",
  colorBgContainer: "#111113",
  colorBgElevated: "#1a1a1e",
  colorBgLayout: "#0a0a0b",
  colorBorder: "#27272a",
  colorBorderSecondary: "#1f1f23",
  colorText: "#e5e5e5",
  colorTextSecondary: "#a1a1aa",
  colorTextTertiary: "#52525b",
};

const SHARED_TOKENS = {
  borderRadius: 8,
  borderRadiusSM: 6,
  borderRadiusLG: 12,
  fontFamily:
    "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyCode: "var(--font-mono), ui-monospace, monospace",
  motionDurationMid: "0.15s",
  motionDurationSlow: "0.25s",
};

function AntdConfigInner({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const tokens = isDark ? DARK_TOKENS : LIGHT_TOKENS;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: { ...SHARED_TOKENS, ...tokens },
        components: {
          Layout: {
            siderBg: tokens.colorBgContainer,
            headerBg: tokens.colorBgContainer,
            bodyBg: tokens.colorBgLayout,
          },
          Input: {
            activeBorderColor: tokens.colorPrimary,
            hoverBorderColor: isDark
              ? "rgba(52, 211, 153, 0.3)"
              : "rgba(16, 185, 129, 0.4)",
          },
          Table: {
            headerBg: isDark ? "#1a1a1e" : "#f8f9fa",
            rowHoverBg: isDark
              ? "rgba(52, 211, 153, 0.04)"
              : "rgba(16, 185, 129, 0.04)",
            borderColor: tokens.colorBorder,
          },
          Modal: {
            contentBg: tokens.colorBgElevated,
            headerBg: tokens.colorBgElevated,
          },
          Drawer: {
            colorBgElevated: tokens.colorBgContainer,
          },
          Tooltip: {
            colorBgSpotlight: isDark ? "#27272a" : "#111827",
            borderRadiusOuter: 6,
          },
          Popover: {
            colorBgElevated: tokens.colorBgElevated,
          },
        },
      }}
    >
      <XProvider>{children}</XProvider>
    </ConfigProvider>
  );
}

export default function AntdProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AntdConfigInner>{children}</AntdConfigInner>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
