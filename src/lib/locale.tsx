"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { NextIntlClientProvider } from "next-intl";
import type { Locale as AntdLocale } from "antd/es/locale";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import jaJP from "antd/locale/ja_JP";
import koKR from "antd/locale/ko_KR";
import zhTW from "antd/locale/zh_TW";

import zhCNMessages from "@/locales/zh_CN.json";
import enUSMessages from "@/locales/en_US.json";
import jaJPMessages from "@/locales/ja_JP.json";
import koKRMessages from "@/locales/ko_KR.json";
import zhTWMessages from "@/locales/zh_TW.json";

export type LocaleId = "zh-CN" | "en-US" | "ja-JP" | "ko-KR" | "zh-TW";

export interface LocaleMeta {
  id: LocaleId;
  label: string;
}

export const LOCALE_LIST: LocaleMeta[] = [
  { id: "zh-CN", label: "简体中文" },
  { id: "en-US", label: "English" },
  { id: "ja-JP", label: "日本語" },
  { id: "ko-KR", label: "한국어" },
  { id: "zh-TW", label: "繁體中文" },
];

const MESSAGES: Record<LocaleId, Record<string, unknown>> = {
  "zh-CN": zhCNMessages,
  "en-US": enUSMessages,
  "ja-JP": jaJPMessages,
  "ko-KR": koKRMessages,
  "zh-TW": zhTWMessages,
};

const ANTD_LOCALES: Record<LocaleId, AntdLocale> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ja-JP": jaJP,
  "ko-KR": koKR,
  "zh-TW": zhTW,
};

interface LocaleContextValue {
  locale: LocaleId;
  setLocale: (id: LocaleId) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "zh-CN",
  setLocale: () => {},
});

const STORAGE_KEY = "minion-chat-locale";

const VALID_LOCALES = new Set<string>(LOCALE_LIST.map((l) => l.id));

function isValidLocale(value: string): value is LocaleId {
  return VALID_LOCALES.has(value);
}

function getClientLocale(): LocaleId {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && isValidLocale(stored)) return stored;

  const nav = navigator.language;
  if (isValidLocale(nav)) return nav;
  if (nav.startsWith("zh-TW") || nav.startsWith("zh-Hant")) return "zh-TW";
  if (nav.startsWith("zh")) return "zh-CN";
  if (nav.startsWith("ja")) return "ja-JP";
  if (nav.startsWith("ko")) return "ko-KR";
  if (nav.startsWith("en")) return "en-US";

  return "zh-CN";
}

export function getAntdLocale(id: LocaleId): AntdLocale {
  return ANTD_LOCALES[id] ?? ANTD_LOCALES["zh-CN"];
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>("zh-CN");
  const [mounted, setMounted] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- hydration: read client locale once after mount */
  useEffect(() => {
    setLocaleState(getClientLocale());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const setLocale = useCallback((id: LocaleId) => {
    setLocaleState(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.lang = id;
  }, []);

  const messages = MESSAGES[locale] ?? MESSAGES["zh-CN"];

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={locale}
        messages={messages as Record<string, string>}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useAppLocale() {
  return useContext(LocaleContext);
}
