import { getFaviconUrl } from "../utils/contentHelpers";
import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Shuffle,
  AlertTriangle,
  X,
  ExternalLink,
  Globe,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ReaderView } from "./ReaderView";
import { PreviewCard } from "./PreviewCard";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import { useReader } from "../hooks/useReader";
import { usePreview } from "../hooks/usePreview";
import type { AuthenticatedFetch } from "../types";

type ContentType = "article" | "image" | "video" | "interactive";

interface StumbleResult {
  id: string;
  url: string;
  proxyUrl?: string;
  title?: string;
  description?: string;
  category: string;
  source: string;
  type?: ContentType;
}

/** Videos render in the embedded player (type, or an /embed/ proxyUrl as a fallback signal). */
function isVideoStumble(
  c: Pick<StumbleResult, "type" | "proxyUrl"> | null,
): boolean {
  return c?.type === "video" || !!c?.proxyUrl?.includes("/embed/");
}

/** Image galleries and interactive sites lose their value in stripped reader mode. */
function isVisualStumble(c: Pick<StumbleResult, "type"> | null): boolean {
  return c?.type === "image" || c?.type === "interactive";
}

/**
 * Content-type-aware default: prose (article / unknown) opens in reader; video,
 * image, and interactive content open live so their visuals/playback survive.
 */
function defaultMode(c: StumbleResult | null): ViewMode {
  return isVideoStumble(c) || isVisualStumble(c) ? "live" : "reader";
}

interface StumbleAreaProps {
  showIframe: boolean;
  loading: boolean;
  error: string | null;
  current: StumbleResult | null;
  iframeError: boolean;
  authenticatedFetch: AuthenticatedFetch;
  onRetry: () => void;
  onClose: () => void;
  onIframeLoad: () => void;
}

/**
 * The central discovery surface. For an active stumble it shows a reader-first
 * hybrid view: a clean extracted article by default (via /reader), the live
 * page (iframe) on demand, and open-in-tab as a last resort. Also handles the
 * empty/ready, loading, and error states.
 */
export function StumbleArea({
  showIframe,
  loading,
  error,
  current,
  iframeError,
  authenticatedFetch,
  onRetry,
  onClose,
  onIframeLoad,
}: StumbleAreaProps) {
  const [isVisible, setIsVisible] = useState(import.meta.env.MODE === "test");
  const [viewMode, setViewMode] = useState<ViewMode>(() => defaultMode(current));
  const [prevId, setPrevId] = useState<string | undefined>(current?.id);
  const containerRef = useRef<HTMLDivElement>(null);

  // Video plays in the embedded player; image/interactive content shows live so
  // its visuals survive — neither should be sent through reader extraction.
  const isVideo = isVideoStumble(current);
  const isVisual = isVisualStumble(current);

  // Reset the view mode whenever a new page is stumbled (adjusting state during
  // render — the documented pattern for syncing state to a prop change).
  if (current?.id !== prevId) {
    setPrevId(current?.id);
    setViewMode(defaultMode(current));
  }

  // Fetch reader content only for prose pages in reader mode (null = no-op).
  const readerUrl =
    showIframe && current && viewMode === "reader" && !isVideo && !isVisual
      ? current.url
      : null;
  const reader = useReader(authenticatedFetch, readerUrl);

  // Image/interactive content can't be embedded — fetch a preview card instead.
  const previewUrl = showIframe && current && isVisual ? current.url : null;
  const preview = usePreview(authenticatedFetch, previewUrl);

  useEffect(() => {
    if (import.meta.env.MODE === "test") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <Card className="flex flex-col gap-4 p-6">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center gap-3 p-10 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!showIframe && !current) {
    return (
      <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <div className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="size-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to explore?
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Hit Stumble to discover the web, one hidden gem at a time.
          </p>
        </div>
        <Button size="lg" className="gap-2" onClick={onRetry}>
          <Shuffle />
          Stumble
        </Button>
      </Card>
    );
  }

  if (showIframe && current) {
    const showReader =
      viewMode === "reader" && !reader.error && !isVideo && !isVisual;
    const iframeSrc = isVisible
      ? current.proxyUrl || current.url
      : "about:blank";

    return (
      <div className="space-y-3" ref={containerRef}>
        {/* Control bar */}
        <Card className="flex flex-row items-center gap-3 p-3">
          <img
            src={getFaviconUrl(current.source)}
            alt=""
            className="size-5 shrink-0 rounded"
            loading="lazy"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {current.title || current.url}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {current.category} · {current.source}
            </p>
          </div>
          {!isVisual && (
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Open in new tab"
          >
            <a href={current.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </Button>
        </Card>

        {/* Content */}
        {isVisual ? (
          <PreviewCard
            url={current.url}
            fallbackTitle={current.title}
            fallbackDescription={current.description}
            preview={preview.data}
            loading={preview.loading}
          />
        ) : showReader ? (
          reader.data ? (
            <div className="max-h-[72vh] overflow-y-auto">
              <ReaderView
                title={reader.data.title}
                byline={reader.data.byline}
                siteName={reader.data.siteName}
                content={reader.data.content}
              />
            </div>
          ) : (
            <Card className="flex flex-col gap-4 p-6">
              <Skeleton className="h-7 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-72 w-full rounded-lg" />
            </Card>
          )
        ) : viewMode === "reader" && reader.error ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <AlertTriangle className="size-6" />
            </div>
            <p className="font-medium">
              We couldn&apos;t generate a reader view for this page.
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Some pages (videos, apps, paywalls) can&apos;t be read inline.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild className="gap-2">
                <a href={current.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open in new tab
                </a>
              </Button>
              <Button
                variant="outline"
                onClick={() => setViewMode("live")}
                className="gap-2"
              >
                <Globe className="size-4" />
                Show live page
              </Button>
            </div>
          </Card>
        ) : iframeError ? (
          <Card className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <AlertTriangle className="size-6" />
            </div>
            <p className="font-medium">
              This page can&apos;t be displayed here.
            </p>
            <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
              {current.url}
            </code>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline" className="gap-2">
                <a href={current.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Open in new tab
                </a>
              </Button>
              <Button onClick={onRetry} className="gap-2">
                <Shuffle className="size-4" />
                Try another
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <iframe
              src={iframeSrc}
              title="Stumbled page"
              className={
                isVideo
                  ? "aspect-video w-full border-none bg-black"
                  : "h-[72vh] w-full border-none bg-white"
              }
              onLoad={onIframeLoad}
              loading="lazy"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
            />
          </Card>
        )}
      </div>
    );
  }

  return null;
}
