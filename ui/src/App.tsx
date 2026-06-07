import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useStumble } from './hooks/useStumble';
import { useFavorites } from './hooks/useFavorites';
import { useHistory } from './hooks/useHistory';
import { usePWA } from './hooks/usePWA';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { CategoryBar } from './components/CategoryBar';
import { StumbleArea } from './components/StumbleArea';
import { ActionButtons } from './components/ActionButtons';
import { HistoryPanel } from './components/HistoryPanel';
import { FavoritesPanel } from './components/FavoritesPanel';
import { RecommendationsPanel } from './components/RecommendationsPanel';
import { SubmissionForm } from './components/SubmissionForm';
import { useToast } from './contexts/ToastContext';
import './App.css';

type Category = 'all' | 'tech' | 'art' | 'science' | 'random';

export function App() {
  const { isInstallable, showInstallPrompt } = usePWA();
  const [category, setCategory] = useState<Category>('all');
  const { addToast } = useToast();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { darkMode, setDarkMode } = useTheme();

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

  const {
    current,
    loading,
    error,
    showIframe,
    iframeError,
    fetchStumble,
    handleClose,
    handleIframeLoad,
  } = useStumble(authenticatedFetch, category);

  const { favorites, showFavorites, setShowFavorites, toggleFavorite, removeFavorite, isFavorite } = useFavorites(authenticatedFetch);
  const { history, showHistory, setShowHistory, loadHistory } = useHistory(authenticatedFetch);

  useKeyboardShortcuts({
    onNext: fetchStumble,
    onLike: () => handleRate('like'),
    onDislike: () => handleRate('dislike'),
    onToggleFavorites: () => setShowFavorites(prev => !prev),
    onToggleHistory: () => setShowHistory(prev => !prev),
    enabled: !!current && showIframe,
  });

  // Rating state
  const [rating, setRating] = useState<'like' | 'dislike' | null>(null);
  const [rateLoading, setRateLoading] = useState(false);

  const handleRate = async (type: 'like' | 'dislike') => {
    if (!current) return;
    setRateLoading(true);
    try {
      await authenticatedFetch(`/rate`, {
        method: 'POST',
        body: JSON.stringify({ assetId: current.id, isPositive: type === 'like' }),
      });
      setRating(type);
      await authenticatedFetch(`/preferences`, {
        method: 'POST',
        body: JSON.stringify({ type: 'category', name: current.category, delta: type === 'like' ? 1 : -1 }),
      });
      await authenticatedFetch(`/preferences`, {
        method: 'POST',
        body: JSON.stringify({ type: 'source', name: current.source, delta: type === 'like' ? 1 : -1 }),
      });
      await loadHistory();
    } catch (err) {
      console.error('Rating failed', err);
      addToast('Rating failed', 'error');
    } finally {
      setRateLoading(false);
    }
  };

  const handleShare = async () => {
    if (!current) return;
    if (navigator.share) {
      try { await navigator.share({ title: current.title, url: current.url }); } catch { /* ignore */ }
    } else {
      await navigator.clipboard.writeText(current.url);
      addToast('Link copied!');
      setTimeout(() => addToast('Failed'), 2000);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) setRecommendations(await res.json());
    } catch {
      addToast('Search failed');
    }
  };

  // Load recommendations
  useEffect(() => {
    authenticatedFetch(`/recommendations`).then(res => res.ok ? res.json() : []).then(setRecommendations);
  }, [authenticatedFetch]);

  // Dark mode effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Dev auth
  useEffect(() => {
    ensureDevAuth();
  }, [ensureDevAuth]);

  return (
    <div className="app-container">
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onUserClick={() => user ? setShowProfile(true) : setShowAuth(true)}
        isInstallable={isInstallable}
        onInstall={showInstallPrompt}
      />

      <AuthModal
        isOpen={showAuth && !user}
        email={email}
        password={password}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onLogin={() => handleAuth(true)}
        onRegister={() => handleAuth(false)}
        onClose={() => setShowAuth(false)}
        apiBase={import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'}
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

      <main className="main-content">
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


        <HistoryPanel history={history} showHistory={showHistory} setShowHistory={setShowHistory} />
        <FavoritesPanel favorites={favorites} showFavorites={showFavorites} setShowFavorites={setShowFavorites} onRemove={removeFavorite} />
        <RecommendationsPanel recommendations={recommendations} />
        <SubmissionForm onSuccess={() => addToast('Submitted!')} authenticatedFetch={authenticatedFetch} />
      </main>
    </div>
  );
}

export default App;