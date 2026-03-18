import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AntdProvider from "./antd-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minion Chat — 游戏运营 AI 助手",
  description:
    "集说明分析、系统数据查询、变更执行于一体的游戏运营 AI 助手，支持 E-system / Artifex / G123 Box / Adnext / Gift / B-system 多系统协作。",
};

const THEME_SCRIPT = `
(function(){
  var t = localStorage.getItem('minion-chat-theme');
  if (!t) t = matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AntdRegistry>
          <AntdProvider>{children}</AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
