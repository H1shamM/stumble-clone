import { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { X, ChevronUp, ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { getFaviconUrl } from "../utils/contentHelpers";
import type { StumbleResult } from "../hooks/useStumble";

type Overlay =
  (typeof import("@teamhive/capacitor-webview-overlay"))["WebviewOverlay"];

interface LiveFeedProps {
  current: StumbleResult | null;
  onNext: () => void;
  onExit: () => void;
  onRate: (rating: "like" | "dislike") => void;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}

/**
 * Live feed mode (BV1, #280): the current stumble's site renders inline,
 * full-screen, in a native WebView (@teamhive/capacitor-webview-overlay) — the
 * "reels of live websites" surface. The native overlay occupies the middle
 * element only, so the top/bottom app chrome (rendered in the Capacitor
 * WebView) stays visible above it. Tap Next → loadUrl the next stumble.
 * Native-only; on web it shows an install hint.
 */
export function LiveFeed({
  current,
  onNext,
  onExit,
  onRate,
  onToggleFavorite,
  isFavorite,
}: LiveFeedProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const overlay = useRef<Overlay | null>(null);
  const openedUrl = useRef<string | null>(null);
  const snapshotActive = useRef(false);
  const native = Capacitor.isNativePlatform();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  // Open the inline webview once on mount; close it on exit.
  useEffect(() => {
    if (!native || !elRef.current || !current) return;
    let cancelled = false;
    (async () => {
      const mod = await import("@teamhive/capacitor-webview-overlay");
      if (cancelled || !elRef.current) return;
      overlay.current = mod.WebviewOverlay;
      // Loading bar (chrome) + reveal the new page once it has loaded.
      mod.WebviewOverlay.onProgress((p) => {
        const v = p.value > 1 ? p.value / 100 : p.value;
        setProgress(v);
        if (v < 1) setLoading(true);
      });
      mod.WebviewOverlay.onPageLoaded(() => {
        setProgress(1);
        setLoading(false);
        if (snapshotActive.current) {
          // Reveal the freshly loaded live page (end the swap freeze).
          mod.WebviewOverlay.toggleSnapshot(false).catch(() => {});
          snapshotActive.current = false;
        }
      });
      try {
        await mod.WebviewOverlay.open({
          url: current.url,
          element: elRef.current,
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
    // Open once; URL changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  // Swap to the next site (loadUrl) whenever the current stumble changes.
  useEffect(() => {
    const url = current?.url;
    if (!url || !overlay.current || openedUrl.current === url) return;
    openedUrl.current = url;
    setLoading(true);
    setProgress(0);
    // Freeze the outgoing page to a snapshot during the swap — the native view
    // is hidden while snapshotting, so we don't flash a half-loaded page.
    // onPageLoaded reveals the new live page (toggleSnapshot(false)).
    overlay.current
      .toggleSnapshot(true)
      .then(() => {
        snapshotActive.current = true;
      })
      .catch(() => {});
    overlay.current.loadUrl(url).catch((e) => {
      console.error("[LiveFeed] loadUrl failed", e);
    });
  }, [current?.url]);

  if (!native) {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-background p-8 text-center">
        <div className="space-y-3">
          <p className="text-lg font-semibold">Live feed runs in the app</p>
          <p className="text-sm text-muted-foreground">
            Install the Android app to browse live sites inline.
          </p>
          <button
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            onClick={onExit}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top chrome */}
      <div
        className="flex items-center gap-2 px-3 pb-2"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 8px)" }}
      >
        {current && (
          <img
            src={getFaviconUrl(current.source)}
            alt=""
            className="size-5 shrink-0 rounded"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {current?.title || current?.url}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {current?.source}
          </p>
        </div>
        <button
          onClick={onExit}
          aria-label="Exit live feed"
          className="grid size-9 place-items-center rounded-full hover:bg-muted"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Loading bar — sits in the chrome (outside the overlay rect) so it
          stays visible above the native view. */}
      <div className="h-0.5 w-full bg-muted">
        {loading && (
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        )}
      </div>

      {/* The native live-site overlay is positioned over this element. */}
      <div ref={elRef} className="flex-1 bg-white" />

      {/* Bottom action bar */}
      <div
        className="flex items-center justify-around gap-1 px-4 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
        <button
          onClick={() => onRate("dislike")}
          aria-label="Dislike"
          className="grid size-11 place-items-center rounded-full hover:bg-muted"
        >
          <ThumbsDown className="size-5" />
        </button>
        <button
          onClick={onToggleFavorite}
          aria-label="Save to favorites"
          className="grid size-11 place-items-center rounded-full hover:bg-muted"
        >
          <Heart
            className={isFavorite ? "size-5 fill-current text-red-500" : "size-5"}
          />
        </button>
        <button
          onClick={() => onRate("like")}
          aria-label="Like"
          className="grid size-11 place-items-center rounded-full hover:bg-muted"
        >
          <ThumbsUp className="size-5" />
        </button>
        <button
          onClick={onNext}
          aria-label="Next stumble"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground active:scale-95"
        >
          <ChevronUp className="size-5" /> Next
        </button>
      </div>
    </div>
  );
}
