"use client";

import { Popover, Flex, Typography } from "antd";
import { BgColorsOutlined, CheckOutlined } from "@ant-design/icons";
import { useTheme } from "@/lib/theme";
import { THEME_LIST, type ThemeId } from "@/lib/themes";
import { useState, useCallback } from "react";

export default function ThemePicker() {
  const { themeId, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSelect = useCallback(
    (id: ThemeId) => {
      setTheme(id);
      setOpen(false);
    },
    [setTheme],
  );

  const content = (
    <div style={{ width: 240 }}>
      <Typography.Text
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--text-muted)",
          display: "block",
          marginBottom: 8,
        }}
      >
        Choose Theme
      </Typography.Text>
      <Flex vertical gap={4}>
        {THEME_LIST.map((t) => {
          const isActive = t.id === themeId;
          return (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                borderRadius: 8,
                border: isActive
                  ? "1px solid var(--accent)"
                  : "1px solid transparent",
                background: isActive ? "var(--accent-subtle)" : "transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                width: "100%",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "var(--bg-hover)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "transparent";
              }}
              aria-label={`Switch to ${t.label} theme`}
              aria-pressed={isActive}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: t.preview.bg,
                  border: `1px solid ${t.colorScheme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "40%",
                    background: t.preview.accent,
                    opacity: 0.7,
                  }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    lineHeight: 1.3,
                  }}
                >
                  {t.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    lineHeight: 1.3,
                  }}
                >
                  {t.colorScheme === "dark" ? "Dark" : "Light"}
                </div>
              </div>
              {isActive && (
                <CheckOutlined
                  style={{
                    fontSize: 12,
                    color: "var(--accent)",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </Flex>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      arrow={false}
    >
      <button
        className="icon-button"
        aria-label="Choose theme"
      >
        <BgColorsOutlined />
      </button>
    </Popover>
  );
}
