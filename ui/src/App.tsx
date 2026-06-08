import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useFavorites } from "./hooks/useFavorites";
import { useHistory } from "./hooks/useHistory";
import { usePWA } from "./hooks/usePWA";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { Header } from "./components/Header";
import { AuthModal } from "./components/AuthModal";
import { ProfileModal } from "./components/ProfileModal";
import { CategoryBar } from "./components/CategoryBar";
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
  const { darkMode, setDarkMode } = useTheme();
  const [networkError, setNetworkError] = useState<string | null>(null);

  const {
    user,
    showAuth,
    showProfile,
    email,
    password,
    setShowAuth,
    setShowProfile,
    setEmail,
    setPassword,
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
    onNext: fetchStumble,
    onLike: () => handleRate("like"),
    onDislike: () => handleRate("dislike"),
    onToggleFavorites: () => setShowFavorites((prev) => !prev),
    onToggleHistory: () => setShowHistory((prev) => !prev),
    enabled: !!current && showIframe,
  });

  const [rating, setRating] = useState<"like" | "dislike" | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const handleRate = async (type: "like" | "dislike") => {
    if (!current) return;
    setRateLoading(true);
    try {
      const response = await authenticatedFetch(`/rate`, {
        method: "POST",
        body: JSON.stringify({
          assetId: current.id,
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
      await loadHistory();
    } catch {
      setNetworkError("Backend unreachable. Please check your connection.");
      addToast("Network error", "error");
    } finally {
      setRateLoading(false);
    }
  };

  const handleShare = async () => {
    if (!current) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: current.title, url: current.url });
      } catch {
        /* ignore */
      }
    } else {
      await navigator.clipboard.writeText(current.url);
      addToast("Link copied!");
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(
        `/search?q=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) setRecommendations(await res.json());
      else if (res.status === 404) addToast("No results found", "info");
      else addToast("Search failed", "error");
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
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    ensureDevAuth();
  }, [ensureDevAuth]);

  return (
    <ErrorBoundary>
      <div className="app-container">
        {networkError && (
          <div className="network-error-banner" role="status">
            <p>⚠️ {networkError}</p>
            <button
              className="btn-secondary"
              onClick={() => {
                setNetworkError(null);
                window.location.reload();
              }}
            >
              Retry
            </button>
          </div>
        )}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          onUserClick={() => (user ? setShowProfile(true) : setShowAuth(true))}
          isInstallable={isInstallable}
          onInstall={showInstallPrompt}
        />

        <AuthModal
          isOpen={showAuth && !user}
          email={email}
          password={password}
          onEmailChange={(e) => setEmail(e.target.value)}
          onPasswordChange={(e) => setPassword(e.target.value)}
          onLogin={() => handleAuth(true)}
          onRegister={() => handleAuth(false)}
          onClose={() => setShowAuth(false)}
          apiBase={
            import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
          }
        />

        <ProfileModal
          isOpen={showProfile && !!user}
          user={user}
          historyCount={history.length}
          favoritesCount={favorites.length}
          onClose={() => setShowProfile(false)}
          onLogout={logout}
        />

        <CategoryBar
          category={category}
          onCategoryChange={setCategory}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onSearchSubmit={handleSearch}
        />

        <main id="main-content" className="main-content">
          <StumbleArea
            showIframe={showIframe}
            loading={loading}
            error={error}
            current={current}
            iframeError={iframeError}
            onRetry={fetchStumble}
            onClose={handleClose}
            onIframeLoad={handleIframeLoad}
          />

          <ActionButtons
            showIframe={showIframe}
            current={current}
            loading={loading}
            rating={rating}
            rateLoading={rateLoading}
            isFavorite={isFavorite(current)}
            onRate={handleRate}
            onToggleFavorite={() => toggleFavorite(current)}
            onShare={handleShare}
            onNext={fetchStumble}
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
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
