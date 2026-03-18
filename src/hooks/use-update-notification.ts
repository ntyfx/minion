import { useEffect, useRef, createElement } from "react";
import { notification, Button } from "antd";
import { useTranslations } from "next-intl";

const POLL_INTERVAL = 5 * 60 * 1000;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "";

export function useUpdateNotification() {
  const t = useTranslations("update");
  const [api, contextHolder] = notification.useNotification({
    placement: "bottomRight",
  });
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (!currentVersion) return;

    const NOTIFICATION_KEY = "app-update";

    async function check() {
      try {
        const res = await fetch(`${basePath}/version.json`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version: string };
        if (version && version !== currentVersion && !notifiedRef.current) {
          notifiedRef.current = true;
          api.info({
            key: NOTIFICATION_KEY,
            title: t("title"),
            description: t("description", { version }),
            duration: 0,
            actions: createElement(
              Button,
              {
                type: "primary",
                size: "large",
                onClick: () => window.location.reload(),
              },
              t("refresh"),
            ),
          });
        }
      } catch {
        // network error — ignore silently
      }
    }

    const id = setInterval(check, POLL_INTERVAL);
    const timeout = setTimeout(check, 10_000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [api, t]);

  return contextHolder;
}
