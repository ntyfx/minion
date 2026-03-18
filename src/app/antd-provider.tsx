"use client";

import { ConfigProvider, theme as antTheme } from "antd";
import { XProvider } from "@ant-design/x";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { getThemeDefinition } from "@/lib/themes";
import ErrorBoundary from "@/components/error-boundary";

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
  const { themeId, colorScheme } = useTheme();
  const isDark = colorScheme === "dark";
  const { antdTokens: tokens, antdOverrides: overrides } =
    getThemeDefinition(themeId);

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
            hoverBorderColor: overrides.inputHoverBorder,
          },
          Table: {
            headerBg: overrides.headerBg,
            rowHoverBg: overrides.rowHoverBg,
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
            colorBgSpotlight: overrides.tooltipBg,
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
