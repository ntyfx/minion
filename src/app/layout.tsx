import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AntdProvider from "./antd-provider";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "Minion Chat — 游戏运营 AI 助手",
  description:
    "集说明分析、系统数据查询、变更执行于一体的游戏运营 AI 助手，支持 E-system / Artifex / G123 Box / Adnext / Gift / B-system 多系统协作。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Minion",
  },
  icons: {
    icon: `${basePath}/favicon.ico`,
    apple: `${basePath}/icons/apple-touch-icon.png`,
  },
};

const THEME_SCRIPT = `
(function(){
  var t = localStorage.getItem('minion-chat-theme');
  if (!t) t = matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.style.colorScheme = t;
})();
`;

// In development (localhost/127.x) we disable service worker entirely to avoid caching issues.
// In production, we still want SW enabled for offline support.
const SW_REGISTER_SCRIPT = `
(function(){
  if (!('serviceWorker' in navigator)) return;

  const isLocalhost = [
    'localhost',
    '127.0.0.1',
    '[::1]',
  ].includes(location.hostname);

  if (isLocalhost) {
    navigator.serviceWorker.getRegistrations().then(function(regs){
      regs.forEach(function(r){ r.unregister(); });
    });
    caches.keys().then(function(keys){
      keys.forEach(function(k){ caches.delete(k); });
    });
    return;
  }

  // Only register in non-localhost environments (production / staging).
  navigator.serviceWorker.register('${basePath}/sw.js', { scope: '${basePath}/' });
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
        <script dangerouslySetInnerHTML={{ __html: SW_REGISTER_SCRIPT }} />
      </head>
      <body>
        <AntdRegistry>
          <AntdProvider>{children}</AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
