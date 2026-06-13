import { getFaviconUrl } from "../utils/contentHelpers";
import { useState } from "react";
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
import { EnrichmentPanel } from "./EnrichmentPanel";
import { SceneReel } from "./SceneReel";
import { ExplainerSkeleton, ExplainerUnavailableCard } from "./ExplainerState";
import { ViewModeToggle, type ViewMode } from "./ViewModeToggle";
import { useReader } from "../hooks/useReader";
import { usePreview } from "../hooks/usePreview";
import { useExplainer } from "../hooks/useExplainer";
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
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    defaultMode(current),
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [prevId, setPrevId] = useState<string | undefined>(current?.id);

  // Video plays in the embedded player; image/interactive content shows live so
  // its visuals survive — neither should be sent through reader extraction.
  const isVideo = isVideoStumble(current);
  const isVisual = isVisualStumble(current);
  // Prose pages are the only assets that get a Reader / Explainer view.
  const isArticle = !isVideo && !isVisual;

  // Reset the view mode whenever a new page is stumbled (adjusting state during
  // render — the documented pattern for syncing state to a prop change).
  if (current?.id !== prevId) {
    setPrevId(current?.id);
    setViewMode(defaultMode(current));
    setIsVideoPlaying(false);
  }

  // Fetch reader content only for prose pages in reader mode (null = no-op).
  const readerUrl =
    showIframe && current && viewMode === "reader" && isArticle
      ? current.url
      : null;
  const reader = useReader(authenticatedFetch, readerUrl);

  // Image/interactive content can't be embedded — fetch a preview card instead.
  const previewUrl = showIframe && current && isVisual ? current.url : null;
  const preview = usePreview(authenticatedFetch, previewUrl);

  // Explainer is opt-in: fetch the AI reel only when the user selects the
  // Explainer mode on an article. 422 / no key surfaces as the unavailable card.
  const explainerUrl =
    showIframe && current && viewMode === "explainer" && isArticle
      ? current.url
      : null;
  const explainer = useExplainer(authenticatedFetch, explainerUrl);

  if (loading) {
    // Mirror the loaded layout (control bar + ~72vh body) so the area keeps its
    // height while fetching — otherwise every Next collapses to a short card and
    // the page jumps. Matches the structure of the `showIframe && current` view.
    return (
      <div className="space-y-3">
        <Card className="flex flex-row items-center gap-3 p-3">
          <Skeleton className="size-5 shrink-0 rounded" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </Card>
        <Card className="overflow-hidden p-0">
          <Skeleton className="h-[72vh] w-full rounded-none" />
        </Card>
      </div>
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
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-8 grid size-24 place-items-center rounded-3xl bg-primary/10">
          <Compass className="size-12 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Ready to explore?
        </h2>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Discover hidden gems from across the web — one surprise at a time.
        </p>
        <button
          onClick={onRetry}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 active:scale-95"
        >
          <Shuffle className="size-5" />
          Stumble
        </button>
      </div>
    );
  }

  if (showIframe && current) {
    const showReader = viewMode === "reader" && !reader.error && isArticle;
    const showExplainer = viewMode === "explainer" && isArticle;
    const iframeSrc = current.proxyUrl || current.url;

    return (
      <div className="space-y-3">
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
            <ViewModeToggle
              mode={viewMode}
              onChange={setViewMode}
              showExplainer={isArticle}
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="Open in new tab"
          >
            <a
              href={
                isVideo && current.url.includes("/embed/")
                  ? current.url.replace("/embed/", "/watch?v=")
                  : current.url
              }
              target="_blank"
              rel="noopener noreferrer"
            >
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
        ) : isVideo && !isVideoPlaying ? (
          <Card className="flex flex-col items-center justify-center p-0 overflow-hidden aspect-video relative">
            <img
              src={
                current.url.includes("vimeo")
                  ? `https://vumbnail.com/${current.url.split("/").pop()?.split("?")?.[0]}.jpg`
                  : `https://img.youtube.com/vi/${current.url.split("/").pop()?.split("?")?.[0]}/hqdefault.jpg`
              }
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-video.png";
              }}
            />
            <Button
              size="lg"
              className="absolute rounded-full size-16"
              onClick={() => setIsVideoPlaying(true)}
              aria-label="Play video"
            >
              <div className="size-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-white ml-1" />
            </Button>
          </Card>
        ) : showExplainer ? (
          // Opt-in AI explainer reel (article-only). Skeleton while generating;
          // a draft with scenes renders the reel; a sceneless draft falls back to
          // the panel; anything else (422 / error / no key) → unavailable card.
          explainer.loading ? (
            <ExplainerSkeleton />
          ) : explainer.data && explainer.data.scenes.length > 0 ? (
            <SceneReel
              title={current.title}
              summary={explainer.data.summary}
              keyPoints={explainer.data.keyPoints}
              scenes={explainer.data.scenes}
              provenance={explainer.data.provenance}
              sourceUrl={explainer.data.sourceUrl}
            />
          ) : explainer.data ? (
            <EnrichmentPanel enrichment={explainer.data} />
          ) : (
            <ExplainerUnavailableCard />
          )
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
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-presentation"
            />
          </Card>
        )}
      </div>
    );
  }

  return null;
}
