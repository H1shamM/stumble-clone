/**
 * @fileoverview Main application component for StumbleClone.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { usePWA } from '../hooks/usePWA';
import './App.css';

/**
 * Result of a stumble action.
 */
interface StumbleResult {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category: string;
  source: string;
}

/**
 * Rated asset item.
 */
interface RatedItem extends StumbleResult {
  rating_val: 'like' | 'dislike';
  timestamp: Date;
}

/**
 * Favorite asset item.
 */
interface FavoriteItem extends StumbleResult {
  id: string;
  savedAt: number;
}

type Category = 'all' | 'tech' | 'art' | 'science' | 'random';

const API_BASE = 'http://localhost:3000/api/v1';

/**
 * Main application component.
 * @returns {JSX.Element}
 */
export function App() {
  // TODO: Add component-level tests for App (rendering, API interaction, state updates)
  const { isInstallable, showInstallPrompt } = usePWA();
  const [current, setCurrent] = useState<StumbleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [rating, setRating] = useState<'like' | 'dislike' | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<RatedItem[]>([]);
  const [recommendations, setRecommendations] = useState<StumbleResult[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [category, setCategory] = useState<Category>('all');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeLoadedRef = useRef(false);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    return fetch(url, { ...options, headers });
  };

  const handleAuth = async (isLogin: boolean): Promise<void> => {
    const endpoint = isLogin ? `${API_BASE}/auth/login` : `${API_BASE}/auth/register`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Auth failed');
      const data = await res.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setShowAuth(false);
      setToast(isLogin ? 'Logged in!' : 'Registered!');
    } catch (err) {
      console.error('Auth error', err);
      setToast('Auth failed');
    }
  };

  /**
   * Handles sharing the current asset URL.
   */
  const handleShare = async (): Promise<void> => {
    if (!current) return;
    const shareData = { title: current.title || 'Check this out!', url: current.url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) { console.error('Share failed', e); }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      setToast('Link copied to clipboard!');
      setTimeout(() => setToast(null), 2000);
    }
  };

  /**
   * Handles asset search.
   * @param {FormEvent} e - The form submission event.
   */
  const ensureDevAuth = useCallback(async (): Promise<void> => {
    const existingToken = localStorage.getItem('token');
    if (existingToken) return;

    const credentials = { email: 'dev@stumble.local', password: 'devpass' };
    const registerResponse = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (registerResponse.ok) {
      const data = await registerResponse.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return;
    }

    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (loginResponse.ok) {
      const data = await loginResponse.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      return;
    }

    throw new Error('Dev auth initialization failed');
  }, []);

  const handleSearch = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      const res = await authenticatedFetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error('Search failed');
      const results = await res.json();
      setRecommendations(results);
    } catch (err) {
      console.error('Search error', err);
      setToast('Search failed');
    }
  };

  const clearIframeTimeout = useCallback(() => {
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = null;
    }
  }, []);

  const setBlockedState = useCallback(() => {
    setIframeError(true);
    clearIframeTimeout();
    if (current) {
      authenticatedFetch(`${API_BASE}/rate`, {
        method: 'POST',
        body: JSON.stringify({ assetId: current.id, isPositive: false, note: 'blocked' }),
      }).catch(console.error);
    }
  }, [current, clearIframeTimeout]);

  useEffect(() => {
    if (showIframe && iframeRef.current) {
      try {
        if (iframeRef.current.contentWindow?.document) {
          // Use setTimeout to avoid direct setState in effect
          setTimeout(() => setIframeError(false), 0);
        }
      } catch {
        // Use setTimeout to avoid direct setState in effect
        setTimeout(() => setBlockedState(), 0);
      }
    }
  }, [showIframe, setBlockedState]);

  const startIframeTimeout = useCallback(() => {
    clearIframeTimeout();
    iframeTimeoutRef.current = setTimeout(() => {
      if (!iframeLoadedRef.current) {
        setBlockedState();
      }
    }, 3000);
  }, [clearIframeTimeout, setBlockedState]);

  const handleIframeLoad = useCallback(() => {
    iframeLoadedRef.current = true;
    clearIframeTimeout();
    setIframeError(false);
  }, [clearIframeTimeout]);

  const isFavorite = current && Array.isArray(favorites) ? favorites.some(f => f.url === current.url) : false;

  const fetchStumble = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowIframe(false);
    setIframeError(false);
    setRating(null);
    iframeLoadedRef.current = false;
    clearIframeTimeout();

    try {
      const res = await authenticatedFetch(`${API_BASE}/stumble?category=${category}`);
      if (!res.ok) throw new Error('Failed to fetch stumble');
      const data: StumbleResult = await res.json();
      setCurrent(data);
      setShowIframe(true);
      startIframeTimeout();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [category, clearIframeTimeout, startIframeTimeout]);

  const handleClose = () => {
    setShowIframe(false);
    setIframeError(false);
    clearIframeTimeout();
    iframeLoadedRef.current = false;
  };

  const handleRate = async (type: 'like' | 'dislike'): Promise<void> => {
    if (!current) return;
    setRateLoading(true);
    try {
      await authenticatedFetch(`${API_BASE}/rate`, {
        method: 'POST',
        body: JSON.stringify({ assetId: current.id, isPositive: type === 'like' }),
      });
      setRating(type);
      if (current) {
        await authenticatedFetch(`${API_BASE}/preferences`, {
          method: 'POST',
          body: JSON.stringify({ type: 'category', name: current.category, delta: type === 'like' ? 1 : -1 }),
        });
        await authenticatedFetch(`${API_BASE}/preferences`, {
          method: 'POST',
          body: JSON.stringify({ type: 'source', name: current.source, delta: type === 'like' ? 1 : -1 }),
        });
      }
      const updatedHistory = await authenticatedFetch(`${API_BASE}/history?limit=20`).then(res => res.ok ? res.json() : []);
      setHistory(updatedHistory);
    } catch (err) {
      console.error('Rating failed', err);
    } finally {
      setRateLoading(false);
    }
  };


  useEffect(() => {
    const initialize = async () => {
      try {
        await ensureDevAuth();
      } catch (err) {
        console.error('Dev auth initialization failed', err);
      }

      authenticatedFetch(`${API_BASE}/favorites`).then(res => res.ok ? res.json() : []).then(setFavorites);
      authenticatedFetch(`${API_BASE}/history?limit=20`).then(res => res.ok ? res.json() : []).then(setHistory);
      authenticatedFetch(`${API_BASE}/recommendations`).then(res => res.ok ? res.json() : []).then(setRecommendations);
    };

    initialize();
  }, [ensureDevAuth]);

  const handleToggleFavorite = async (): Promise<void> => {
    if (!current) return;
    try {
      if (isFavorite) {
        await authenticatedFetch(`${API_BASE}/favorites/${current.id}`, { method: 'DELETE' });
      } else {
        await authenticatedFetch(`${API_BASE}/favorites`, {
          method: 'POST',
          body: JSON.stringify({ assetId: current.id }),
        });
      }
      const res = await authenticatedFetch(`${API_BASE}/favorites`);
      const updatedFavorites = await res.json();
      setFavorites(updatedFavorites);
    } catch (err) {
      console.error('Favorite toggle failed', err);
    }
  };

  const handleRemoveFavorite = async (assetId: string): Promise<void> => {
    try {
      await authenticatedFetch(`${API_BASE}/favorites/${assetId}`, { method: 'DELETE' });
      const res = await authenticatedFetch(`${API_BASE}/favorites`);
      const updatedFavorites = await res.json();
      setFavorites(updatedFavorites);
    } catch (err) {
      console.error('Favorite removal failed', err);
    }
  };

  const handleNext = () => fetchStumble();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => () => clearIframeTimeout(), [clearIframeTimeout]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-row">
          <h1 className="logo">StumbleClone</h1>
          <p className="tagline">Discover the web</p>
          <button className="btn theme-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle theme">
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button className="btn secondary" onClick={() => setShowAuth(true)}>
            {user ? user.email : 'Login/Register'}
          </button>
          {isInstallable && (
            <button className="btn secondary install-btn" onClick={showInstallPrompt} aria-label="Install App">
              📲 Install
            </button>
          )}
        </div>
      </header>

      {showAuth && !user && (
        <div className="auth-modal">
          <div className="auth-content">
            <h2>Login / Register</h2>
            <input type="email" placeholder="Email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
            <button className="btn primary" onClick={() => handleAuth(true)}>Login</button>
            <button className="btn secondary" onClick={() => handleAuth(false)}>Register</button>
            <button className="btn secondary" onClick={() => setShowAuth(false)}>Close</button>
          </div>
        </div>
      )}
      
      <div className="category-bar">
        <div className="category-selector">
          <label htmlFor="category">Filter by:</label>
          <select id="category" value={category} onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as Category)}>
            <option value="all">All</option>
            <option value="tech">Tech</option>
            <option value="art">Art</option>
            <option value="science">Science</option>
            <option value="random">Random</option>
          </select>
        </div>
        <form onSubmit={handleSearch}>
          <input type="text" placeholder="Search assets..." value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} />
          <button type="submit">Search</button>
        </form>
      </div>

      <main className="main-content">
        {!showIframe && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🚀</div>
            <h2>Ready to explore?</h2>
            <p>Click Stumble to discover the web, one page at a time!</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <p>Finding something interesting...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button className="btn-primary" onClick={fetchStumble}>Try Again</button>
          </div>
        )}

        {showIframe && current && !iframeError && (
          <div className="iframe-container">
            <div className="iframe-header">
              <span className="iframe-title">{current.title || current.url}</span>
              <button className="close-btn" onClick={handleClose} aria-label="Close iframe">✖</button>
            </div>
            <iframe
              ref={iframeRef}
              src={current.url}
              title="Stumbled page"
              className="iframe"
              onLoad={handleIframeLoad}
              onError={setBlockedState}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        )}

        {showIframe && iframeError && (
          <div className="iframe-fallback">
            <p>This page cannot be embedded.</p>
            <code className="fallback-url">{current?.url}</code>
            <div className="fallback-actions">
              <a href={current?.url} target="_blank" rel="noopener noreferrer" className="btn-primary">Open in new tab</a>
              <button className="btn-secondary" onClick={fetchStumble}>Try Another</button>
            </div>
            <button className="close-btn" onClick={handleClose}>Close</button>
          </div>
        )}

        <div className="controls">
          {!current || !showIframe ? (
            <button className="btn primary stumble-btn" onClick={fetchStumble} disabled={loading}>
              {loading ? 'Stumbling...' : '🎲 Stumble'}
            </button>
          ) : (
            <div className="action-bar">
            <div className="rating-group">
              <button className={`btn rate-btn ${rating === 'like' ? 'active' : ''}`} onClick={() => handleRate('like')} disabled={rateLoading || rating !== null} aria-label="Like">👍</button>
              <button className={`btn rate-btn ${rating === 'dislike' ? 'active' : ''}`} onClick={() => handleRate('dislike')} disabled={rateLoading || rating !== null} aria-label="Dislike">👎</button>
            </div>
            <button className={`btn rate-btn ${isFavorite ? 'active' : ''}`} onClick={handleToggleFavorite} aria-label="Save to favorites">
              {isFavorite ? '⭐' : '☆'}
            </button>
            <button className="btn rate-btn" onClick={handleShare} aria-label="Share">📤</button>
            <button className="btn secondary next-btn" onClick={handleNext} disabled={loading}>
              {loading ? '...' : '➡️ Next Stumble'}
            </button>
            </div>
            )}
            </div>

            {toast && <div className="toast">{toast}</div>}
        <div className="history-section">
          <button className="btn secondary history-toggle" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '🔽 Hide History' : '📋 View History'} ({history.length})
          </button>
          {showHistory && (
            <div className="history-panel">
              {history.length === 0 ? (
                <p className="history-empty">📜 No history yet. Start exploring!</p>
              ) : (
                <ul className="history-list">
                  {history.slice(0, 10).map((item) => (
                    <li key={item.timestamp.toString()} className="history-item">
                      <span className="history-rating">{item.rating_val === 'like' ? '👍' : '👎'}</span>
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="history-url">{item.url}</a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="favorites-section">
          <button className="btn secondary favorites-toggle" onClick={() => setShowFavorites(!showFavorites)}>
            {showFavorites ? '🔽 Hide Favorites' : '⭐ Favorites'} ({favorites.length})
          </button>
          {showFavorites && (
            <div className="favorites-panel">
              {favorites.length === 0 ? (
                <p className="favorites-empty">⭐ No favorites yet. Keep stumbling!</p>
              ) : (
                <ul className="favorites-list">
                  {(Array.isArray(favorites) ? favorites : []).map((item) => (
                    <li key={item.id} className="favorites-item">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="favorites-url">{item.url}</a>
                      <button className="btn-remove-fav" onClick={() => handleRemoveFavorite(item.id)} aria-label="Remove from favorites">✖</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="recommendations-section">
          <h2>Recommended for you</h2>
          {recommendations.length === 0 ? (
            <p>No recommendations yet. Keep rating content!</p>
          ) : (
            <ul className="recommendations-list">
              {recommendations.map((item) => (
                <li key={item.id} className="recommendation-item">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title || item.url}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
