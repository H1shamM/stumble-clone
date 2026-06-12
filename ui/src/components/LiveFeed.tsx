import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import {
  ChevronUp,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Maximize2,
  BookOpen,
  Globe,
  Loader2,
} from "lucide-react";
import { getFaviconUrl } from "../utils/contentHelpers";
import { useHaptics } from "../hooks/useHaptics";
import { useReader } from "../hooks/useReader";
import { ReaderView } from "./ReaderView";
import type { StumbleResult } from "../hooks/useStumble";
import type { AuthenticatedFetch } from "../types";

type Overlay =
  (typeof import("@teamhive/capacitor-webview-overlay"))["WebviewOverlay"];

// Make old/desktop sites render mobile-friendly: a phone user-agent (so
// responsive sites serve their mobile layout) + force a device-width viewport
// (so non-responsive sites render at device width instead of a zoomed-out
// ~980px desktop layout). Enhancements are re-applied after every load.
const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36";

// Injected stylesheet that does two jobs, applied to every page:
//   1. Normalization — readable text + no horizontal overflow, so even
//      non-responsive desktop sites are usable at phone width.
//   2. Conservative cosmetic blocking — hide the worst mobile offenders (ad
//      containers, cookie/consent walls, newsletter modals). Selectors are
//      kept *precise* on purpose: only well-known ad-network markers and named
//      CMP vendors, never broad substrings like `*=ad*` (which would match
//      "header"/"load"/"gradient"). We never hide body-level scroll-lock
//      classes (that would blank the page) and we force scroll back on so a
//      killed modal can't leave the page frozen.
const ENHANCE_CSS = `
html{-webkit-text-size-adjust:100%!important;}
img,video,iframe,embed,object,table,pre{max-width:100%!important;}
img,video{height:auto!important;}
body{overflow-x:hidden!important;}
html,body{overflow-y:auto!important;}
*{overflow-wrap:break-word;word-break:break-word;}
ins.adsbygoogle,[id^="google_ads"],[id*="div-gpt-ad"],[class*="advertisement" i],[id*="advertisement" i],[aria-label="Advertisement" i],iframe[src*="doubleclick"],iframe[src*="googlesyndication"],iframe[src*="adservice."],iframe[src*="/ads/"]{display:none!important;}
#onetrust-consent-sdk,.onetrust-pc-dark-filter,.qc-cmp2-container,#CybotCookiebotDialog,.fc-consent-root,#didomi-host,.trustarc-banner,.truste_overlay,.osano-cm-window,.osano-cm-dialog,[class*="cookie-banner" i],[class*="cookie-notice" i],[class*="cookie-consent" i],[id*="cookie-banner" i],[class*="gdpr" i],[id*="gdpr" i],[aria-label*="cookie" i][role="dialog"]{display:none!important;}
[class*="newsletter" i][class*="modal" i],[class*="newsletter" i][class*="popup" i],[class*="interstitial" i]{display:none!important;}
`;

// Set the mobile viewport and (re)inject the enhancement stylesheet. Idempotent
// — keyed on a stable id — and re-runnable after every navigation. CSS applies
// to elements added later too, so no MutationObserver is needed.
const ENHANCE_PAGE = `(function(){try{var m=document.querySelector('meta[name="viewport"]');if(!m){m=document.createElement('meta');m.setAttribute('name','viewport');(document.head||document.documentElement).appendChild(m);}m.setAttribute('content','width=device-width, initial-scale=1, viewport-fit=cover');var s=document.getElementById('sc-enhance');if(!s){s=document.createElement('style');s.id='sc-enhance';(document.head||document.documentElement).appendChild(s);}s.textContent=${JSON.stringify(ENHANCE_CSS)};}catch(e){}})();`;

interface LiveFeedProps {
  current: StumbleResult | null;
  onNext: () => void;
  onRate: (rating: "like" | "dislike") => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
  /** Hide the native WebView (it renders above all React UI) while a menu /
   *  modal is open, so that overlay isn't trapped behind the live site. */
  paused?: boolean;
  /** Immersive mode hides the app header + this feed's chrome so the live site
   *  gets the full screen; only a thin restore strip remains. */
  immersive?: boolean;
  /** Toggle immersive mode (the header is owned by the app shell). */
  onToggleImmersive?: () => void;
  /** Used to fetch the clean reader view for articles (lazy — only when the
   *  Reader toggle is on). */
  authenticatedFetch: AuthenticatedFetch;
}

/**
 * The live-site discovery surface on mobile: the current stumble's website
 * renders **inline in the content area** via a native WebView overlay
 * (@teamhive/capacitor-webview-overlay). It lives *inside the normal app shell*
 * — the app header (search / menu / dark / account) stays above it and is
 * always available — so this is not a separate full-screen "mode". The native
 * overlay covers the middle element only; the context bar above and the action
 * bar below are React chrome.
 *
 * **Immersive mode** hides the header (app shell) + this feed's chrome so the
 * site fills the screen; the overlay's `ResizeObserver` repositions the native
 * view automatically when the element grows. A thin restore strip stays *below*
 * the overlay (React chrome the WebView can't eat) to bring the controls back.
 *
 * **Reader mode** (articles only) hides the native overlay and renders our
 * clean extracted reader in the same area — reading a full desktop article on a
 * phone is worse than the reader. It's keyed on the current url so it resets
 * automatically when you advance to the next site. Native-only. Fills its
 * parent (h-full).
 */
export function LiveFeed({
  current,
  onNext,
  onRate,
  onToggleFavorite,
  isFavorite,
  paused = false,
  immersive = false,
  onToggleImmersive,
  authenticatedFetch,
}: LiveFeedProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const overlay = useRef<Overlay | null>(null);
  const openedUrl = useRef<string | null>(null);
  const native = Capacitor.isNativePlatform();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { impact } = useHaptics();

  // Reader mode is keyed on the url it was turned on for, so advancing to the
  // next stumble (a different url) auto-exits reader — no reset effect needed.
  const isArticle = current?.type === "article";
  const [readerUrl, setReaderUrl] = useState<string | null>(null);
  const readerMode = !!current && isArticle && readerUrl === current.url;
  const toggleReader = () => {
    impact("light");
    setReaderUrl(readerMode ? null : (current?.url ?? null));
  };
  const {
    data: reader,
    loading: readerLoading,
    error: readerError,
  } = useReader(authenticatedFetch, readerMode ? current!.url : null);
  const swipeStart = useRef<{ y: number; t: number } | null>(null);

  const advance = () => {
    impact("medium");
    onNext();
  };

  // The bottom handle is React chrome (outside the native overlay's element),
  // so it reliably captures the flick the live WebView would otherwise eat.
  const onHandleTouchStart = (e: React.TouchEvent) => {
    swipeStart.current = { y: e.touches[0].clientY, t: Date.now() };
  };
  const onHandleTouchEnd = (e: React.TouchEvent) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (!s) return;
    const dy = e.changedTouches[0].clientY - s.y;
    const dt = Date.now() - s.t;
    if (dy < -45 && dt < 600) advance();
  };

  // The immersive restore strip: a downward flick (or tap) brings the chrome
  // back, mirroring how mobile browsers reveal a hidden toolbar.
  const onRestoreTouchEnd = (e: React.TouchEvent) => {
    const s = swipeStart.current;
    swipeStart.current = null;
    if (!s) return;
    const dy = e.changedTouches[0].clientY - s.y;
    const dt = Date.now() - s.t;
    if (dy > 45 && dt < 600) {
      impact("light");
      onToggleImmersive?.();
    }
  };

  // Open the inline webview once on mount; close it on unmount.
  useEffect(() => {
    if (!native || !elRef.current || !current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("@teamhive/capacitor-webview-overlay");
      if (cancelled || !elRef.current) return;
      overlay.current = mod.WebviewOverlay;
      mod.WebviewOverlay.onProgress((p) => {
        const v = p.value > 1 ? p.value / 100 : p.value;
        setProgress(v);
        if (v < 1) setLoading(true);
      });
      mod.WebviewOverlay.onPageLoaded(() => {
        setProgress(1);
        setLoading(false);
        // Re-apply mobile viewport + readability/cosmetic stylesheet each load.
        mod.WebviewOverlay.evaluateJavaScript(ENHANCE_PAGE).catch(() => {});
      });
      try {
        await mod.WebviewOverlay.open({
          url: current.url,
          element: elRef.current,
          userAgent: MOBILE_UA,
        });
        openedUrl.current = current.url;
      } catch (e) {
        console.error("[LiveFeed] open failed", e);
      }
    })();
    return () => {
      cancelled = true;
      overlay.current?.close().catch(() => {});
      overlay.current = null;
      openedUrl.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  // Navigate the same overlay to each new stumble. The WebView stays live
  // (always scrollable) — the loading bar covers the load.
  useEffect(() => {
    const url = current?.url;
    if (!url || !overlay.current || openedUrl.current === url) return;
    openedUrl.current = url;
    setLoading(true);
    setProgress(0);
    overlay.current.loadUrl(url).catch((e) => {
      console.error("[LiveFeed] loadUrl failed", e);
    });
  }, [current?.url]);

  // Hide the native WebView (show a static snapshot) while a menu/modal is open
  // or while reader mode is showing our React reader over the same area, so the
  // overlay isn't trapped above our UI; restore it otherwise.
  useEffect(() => {
    overlay.current?.toggleSnapshot(paused || readerMode).catch(() => {});
  }, [paused, readerMode]);

  if (!native) {
    return (
      <div className="grid h-full place-items-center bg-background p-8 text-center text-sm text-muted-foreground">
        Live site browsing runs in the Android app.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Context bar: which site you're viewing + enter-immersive control.
          Hidden in immersive mode to free the space for the site. */}
      {!immersive && (
        <div className="flex items-center gap-2 px-4 py-2">
          {current && (
            <img
              src={getFaviconUrl(current.source)}
              alt=""
              className="size-5 shrink-0 rounded border border-border"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-tight">
              {current?.title || current?.url}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {current?.source}
            </p>
          </div>
          {isArticle && (
            <button
              onClick={toggleReader}
              aria-label={readerMode ? "Show live site" : "Read article"}
              aria-pressed={readerMode}
              className={
                "grid size-9 shrink-0 place-items-center rounded-full transition-colors hover:bg-muted " +
                (readerMode
                  ? "bg-primary/10 text-primary hover:text-primary"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              {readerMode ? (
                <Globe className="size-4" />
              ) : (
                <BookOpen className="size-4" />
              )}
            </button>
          )}
          {onToggleImmersive && (
            <button
              onClick={() => {
                impact("light");
                onToggleImmersive();
              }}
              aria-label="Expand to full screen"
              className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Maximize2 className="size-4" />
            </button>
          )}
        </div>
      )}

      {/* Loading bar — outside the overlay rect so it stays visible. */}
      <div className="h-0.5 w-full bg-muted">
        {loading && (
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        )}
      </div>

      {/* The native live-site overlay is positioned over `elRef` (kept mounted
          across the immersive/reader toggles so it's never re-opened; the
          plugin's ResizeObserver repositions the native view as it grows). In
          reader mode the overlay is hidden and our reader renders on top. */}
      <div className="relative flex-1">
        <div ref={elRef} className="absolute inset-0 bg-white" />
        {readerMode && (
          <div className="absolute inset-0 overflow-y-auto bg-background px-4 py-4">
            {readerLoading ? (
              <div className="grid h-full place-items-center text-muted-foreground">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : readerError || !reader ? (
              <div className="grid h-full place-items-center px-6 text-center">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Reader view isn’t available for this page.
                  </p>
                  <button
                    onClick={() => setReaderUrl(null)}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <Globe className="size-4" /> View the live site
                  </button>
                </div>
              </div>
            ) : (
              <ReaderView
                title={reader.title}
                byline={reader.byline}
                siteName={reader.siteName}
                content={reader.content}
              />
            )}
          </div>
        )}
      </div>

      {immersive ? (
        // Immersive: only a thin restore strip stays below the overlay (the
        // native view can't eat touches here, so the control stays reachable).
        <div
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onRestoreTouchEnd}
          onClick={() => {
            impact("light");
            onToggleImmersive?.();
          }}
          role="button"
          aria-label="Show controls"
          className="flex touch-none flex-col items-center gap-0.5 border-t border-border bg-background/95 pb-2 pt-1.5"
        >
          <ChevronDown className="size-4 text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Swipe down for controls
          </span>
        </div>
      ) : (
        // Bottom: swipe-up handle + action bar (rating cluster + Next).
        <div className="border-t border-border pb-3">
          <div
            onTouchStart={onHandleTouchStart}
            onTouchEnd={onHandleTouchEnd}
            onClick={advance}
            role="button"
            aria-label="Swipe up for the next site"
            className="flex touch-none flex-col items-center gap-1 pb-1 pt-2"
          >
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Swipe up for next
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 px-4 pt-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  impact("light");
                  onRate("dislike");
                }}
                aria-label="Dislike"
                className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ThumbsDown className="size-5" />
              </button>
              <button
                onClick={() => {
                  impact("light");
                  onToggleFavorite();
                }}
                aria-label="Save to favorites"
                className={
                  "grid size-11 place-items-center rounded-full transition-colors hover:bg-muted " +
                  (isFavorite
                    ? "text-red-500"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                <Heart
                  className={isFavorite ? "size-5 fill-current" : "size-5"}
                />
              </button>
              <button
                onClick={() => {
                  impact("light");
                  onRate("like");
                }}
                aria-label="Like"
                className="grid size-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ThumbsUp className="size-5" />
              </button>
            </div>
            <button
              onClick={advance}
              aria-label="Next stumble"
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition active:scale-95"
            >
              <ChevronUp className="size-5" /> Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
