import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minion Chat — 游戏运营 AI 助手",
    short_name: "Minion",
    description:
      "集说明分析、系统数据查询、变更执行于一体的游戏运营 AI 助手",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#141414",
    theme_color: "#10b981",
    icons: [
      {
        src: `${basePath}/icons/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${basePath}/icons/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: `${basePath}/icons/icon-maskable-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
