import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  return {
    locale: "zh-CN",
    messages: (await import("@/locales/zh_CN.json")).default,
  };
});
