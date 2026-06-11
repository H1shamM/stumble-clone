import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";
import { useHistory } from "./hooks/useHistory";
import { usePWA } from "./hooks/usePWA";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { AuthModal } from "./components/AuthModal";
import { ProfileModal } from "./components/ProfileModal";
import { StumbleArea } from "./components/StumbleArea";
import { ActionButtons } from "./components/ActionButtons";
import { HistoryPanel } from "./components/HistoryPanel";
import { FavoritesPanel } from "./components/FavoritesPanel";
import { RecommendationsPanel } from "./components/RecommendationsPanel";
import { SubmissionForm } from "./components/SubmissionForm";
import { useToast } from "./contexts/ToastContext";
import { useStumble, type StumbleResult } from "./hooks/useStumble";
import type { AuthenticatedFetch } from "./types";
import { ErrorBoundary } from "./components/ErrorBoundary";

type Category = "all" | "tech" | "art" | "science" | "random";

export function App() {
  const { isInstallable, showInstallPrompt } = usePWA();
  const [category, setCategory] = useState<Category>("all");
  const { addToast } = useToast();
  const [recommendations, setRecommendations] = useState<StumbleResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<StumbleResult[]>([]);
  const [searchIndex, setSearchIndex] = useState(0);
  const { darkMode, setDarkMode } = useTheme();
  const [networkError, setNetworkError] = useState<string | null>(null);

  const {
    user,
    showAuth,
    showProfile,
    setShowAuth,
    setShowProfile,
    authenticatedFetch,
    handleAuth,
    logout,
    ensureDevAuth,
  } = useAuth();

  const typedAuthenticatedFetch = authenticatedFetch as AuthenticatedFetch;

  const {
    current,
    loading,
    error,
    showIframe,
    iframeError,
    fetchStumble,
    handleClose,
    handleIframeLoad,
  } = useStumble(typedAuthenticatedFetch, category);

  // Search-results mode: when a search returns hits, the main discovery view
  // shows those results and Next cycles through them (not the random pool).
  const inSearch = searchResults.length > 0;
  const activeCurrent = inSearch
    ? (searchResults[searchIndex] ?? null)
    : current;
  const activeShowIframe = inSearch ? true : showIframe;
  const exitSearch = () => {
    setSearchResults([]);
    setSearchQuery("");
    setSearchIndex(0);
  };
  const handleNext = inSearch
    ? () => setSearchIndex((i) => (i + 1) % searchResults.length)
    : fetchStumble;

  const {
    favorites,
    showFavorites,
    setShowFavorites,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  } = useFavorites(typedAuthenticatedFetch);
  const { history, showHistory, setShowHistory, loadHistory } = useHistory(
    typedAuthenticatedFetch,
  );

  useKeyboardShortcuts({
    onNext: handleNext,
    onLike: () => handleRate("like"),
    onDislike: () => handleRate("dislike"),
    onToggleFavorites: () => setShowFavorites((prev) => !prev),
    onToggleHistory: () => setShowHistory((prev) => !prev),
    enabled: !!activeCurrent && activeShowIframe,
  });

  const [rating, setRating] = useState<"like" | "dislike" | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const handleRate = async (type: "like" | "dislike") => {
    if (!activeCurrent) return;
    setRateLoading(true);
    try {
      const response = await authenticatedFetch(`/rate`, {
        method: "POST",
        body: JSON.stringify({
          assetId: activeCurrent.id,
          isPositive: type === "like",
        }),
      });
      if (!response.ok) {
        if (response.status === 404) addToast("Asset not found", "error");
        else if (response.status === 429)
          addToast("Too many requests, try again later", "error");
        else addToast("Rating failed", "error");
        return;
      }
      setRating(type);
      addToast(
        type === "like"
          ? "Liked — we'll show you more like this"
          : "Noted — fewer like this",
      );
      await loadHistory();
    } catch {
      setNetworkError("Backend unreachable. Please check your connection.");
      addToast("Network error", "error");
    } finally {
      setRateLoading(false);
    }
  };

  const handleShare = async () => {
    if (!activeCurrent) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeCurrent.title,
          url: activeCurrent.url,
        });
      } catch {
        /* ignore */
      }
    } else {
      await navigator.clipboard.writeText(activeCurrent.url);
      addToast("Link copied!");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      exitSearch();
      return;
    }
    try {
      const res = await authenticatedFetch(
        `/search?q=${encodeURIComponent(q)}`,
      );
      if (res.ok) {
        const results: StumbleResult[] = await res.json();
        if (results.length === 0) {
          addToast("No results found", "info");
          setSearchResults([]);
        } else {
          setSearchResults(results);
          setSearchIndex(0);
        }
      } else if (res.status === 404) {
        addToast("No results found", "info");
        setSearchResults([]);
      } else addToast("Search failed", "error");
    } catch {
      setNetworkError("Backend unreachable.");
    }
  };

  useEffect(() => {
    authenticatedFetch(`/recommendations`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRecommendations)
      .catch(() => setNetworkError("Failed to load recommendations."));
  }, [authenticatedFetch]);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    ensureDevAuth();
  }, [ensureDevAuth]);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 rounded-md bg-primary px-3 py-2 text-primary-foreground"
        >
          Skip to main content
        </a>

        <Sidebar
          category={category}
          onCategoryChange={setCategory}
          isInstallable={isInstallable}
          onInstall={showInstallPrompt}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            user={user}
            onUserClick={() =>
              user ? setShowProfile(true) : setShowAuth(true)
            }
            onLogout={logout}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearchSubmit={handleSearch}
          />

          {networkError && (
            <div
              className="mx-4 mt-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-destructive sm:mx-6"
              role="status"
            >
              <p>⚠️ {networkError}</p>
              <button
                className="rounded-md bg-destructive px-3 py-1 text-sm text-white"
                onClick={() => {
                  setNetworkError(null);
                  window.location.reload();
                }}
              >
                Retry
              </button>
            </div>
          )}

          <AuthModal
            isOpen={showAuth && !user}
            onLogin={(values) => {
              handleAuth(values.email, values.password, true);
            }}
            onRegister={(values) => {
              handleAuth(values.email, values.password, false);
            }}
            onClose={() => setShowAuth(false)}
          />

          <ProfileModal
            isOpen={showProfile && !!user}
            user={user}
            historyCount={history.length}
            favoritesCount={favorites.length}
            onClose={() => setShowProfile(false)}
            onLogout={logout}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
          >
            <div className="mx-auto w-full max-w-5xl space-y-6">
              {inSearch && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2 text-sm">
                  <span className="truncate text-muted-foreground">
                    {searchResults.length} result
                    {searchResults.length === 1 ? "" : "s"} for{" "}
                    <span className="font-medium text-foreground">
                      “{searchQuery}”
                    </span>{" "}
                    · {searchIndex + 1}/{searchResults.length}
                  </span>
                  <button
                    onClick={exitSearch}
                    className="shrink-0 font-medium text-muted-foreground hover:text-foreground"
                  >
                    Exit search
                  </button>
                </div>
              )}

              <StumbleArea
                showIframe={activeShowIframe}
                loading={inSearch ? false : loading}
                error={inSearch ? null : error}
                current={activeCurrent}
                iframeError={inSearch ? false : iframeError}
                authenticatedFetch={typedAuthenticatedFetch}
                onRetry={handleNext}
                onClose={inSearch ? exitSearch : handleClose}
                onIframeLoad={handleIframeLoad}
              />

              <ActionButtons
                showIframe={activeShowIframe}
                current={activeCurrent}
                loading={inSearch ? false : loading}
                rating={rating}
                rateLoading={rateLoading}
                isFavorite={isFavorite(activeCurrent)}
                onRate={handleRate}
                onToggleFavorite={() => toggleFavorite(activeCurrent)}
                onShare={handleShare}
                onNext={handleNext}
              />

              <HistoryPanel
                history={history}
                showHistory={showHistory}
                setShowHistory={setShowHistory}
                onStumble={fetchStumble}
              />
              <FavoritesPanel
                favorites={favorites}
                showFavorites={showFavorites}
                setShowFavorites={setShowFavorites}
                onRemove={removeFavorite}
                onStumble={fetchStumble}
              />
              <RecommendationsPanel recommendations={recommendations} />
              <SubmissionForm
                onSuccess={() => addToast("Submitted!")}
                authenticatedFetch={typedAuthenticatedFetch}
              />
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;
