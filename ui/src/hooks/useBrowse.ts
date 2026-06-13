import { useCallback } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Opens a URL *inside the app* on native via a real native WebView
 * (`@capacitor/inappbrowser`). This is the supported way to render an
 * un-iframable site in-app — an `<iframe>` inside the Capacitor WebView still
 * hits X-Frame-Options / CSP, so the native browser surface is required
 * (see docs/MOBILE_BUILD_PLAN.md). On the web it falls back to a new tab.
 *
 * The plugin is dynamically imported so the web bundle never pulls in native
 * plugin code (and tests don't need it).
 */
export function useBrowse() {
  const open = useCallback(async (url: string) => {
    if (Capacitor.isNativePlatform()) {
      const { InAppBrowser, DefaultWebViewOptions } =
        await import("@capacitor/inappbrowser");
      await InAppBrowser.openInWebView({
        url,
        options: { ...DefaultWebViewOptions, showURL: true },
      });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, []);

  return { open };
}
