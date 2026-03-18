import { describe, it, expect } from "vitest";
import manifest from "../manifest";

describe("manifest", () => {
  it("returns a valid web app manifest", () => {
    const m = manifest();

    expect(m.name).toBe("Minion Chat — 游戏运营 AI 助手");
    expect(m.short_name).toBe("Minion");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toBe("#10b981");
    expect(m.background_color).toBe("#141414");
  });

  it("includes required PWA icons", () => {
    const m = manifest();
    const icons = m.icons ?? [];

    expect(icons.length).toBe(3);

    const sizes = icons.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    const maskable = icons.find((i) => i.purpose === "maskable");
    expect(maskable).toBeDefined();
    expect(maskable!.sizes).toBe("512x512");
  });

  it("all icon srcs are PNG", () => {
    const m = manifest();
    const icons = m.icons ?? [];

    for (const icon of icons) {
      expect(icon.type).toBe("image/png");
      expect(icon.src).toMatch(/\.png$/);
    }
  });

  it("start_url and scope default to root in dev", () => {
    const m = manifest();

    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
  });
});
