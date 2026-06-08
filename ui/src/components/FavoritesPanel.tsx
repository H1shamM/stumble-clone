interface FavoriteItem {
  id: string;
  url: string;
  title?: string;
}

interface FavoritesPanelProps {
  favorites: FavoriteItem[];
  showFavorites: boolean;
  setShowFavorites: (val: boolean) => void;
  onRemove: (id: string) => void;
  onStumble?: () => void;
}

export function FavoritesPanel({
  favorites,
  showFavorites,
  setShowFavorites,
  onRemove,
  onStumble,
}: FavoritesPanelProps) {
  return (
    <div className="favorites-section">
      <button
        className="btn secondary favorites-toggle"
        onClick={() => setShowFavorites(!showFavorites)}
      >
        {showFavorites ? "🔽 Hide Favorites" : "⭐ Favorites"} (
        {favorites.length})
      </button>
      {showFavorites && (
        <div className="favorites-panel">
          {favorites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <h3>No favorites yet</h3>
              <p>Your treasure chest is empty. Star something cool!</p>
              <button className="btn-primary" onClick={onStumble}>
                Explore now
              </button>
            </div>
          ) : (
            <ul className="favorites-list">
              {favorites.map((item) => (
                <li key={item.id} className="favorites-item">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="favorites-url"
                  >
                    {item.title || item.url}
                  </a>
                  <button
                    className="btn-remove-fav"
                    onClick={() => onRemove(item.id)}
                    aria-label="Remove from favorites"
                  >
                    ✖
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
