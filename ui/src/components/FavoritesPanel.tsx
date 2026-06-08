import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="mt-space-6">
      <Button
        variant="outline"
        onClick={() => setShowFavorites(!showFavorites)}
        className="w-full justify-between"
      >
        <span>{showFavorites ? "🔽 Hide Favorites" : "⭐ Favorites"}</span>
        <span>({favorites.length})</span>
      </Button>
      {showFavorites && (
        <Card className="mt-space-4">
          <CardHeader>
            <CardTitle>Favorites</CardTitle>
          </CardHeader>
          <CardContent>
            {favorites.length === 0 ? (
              <div className="text-center py-space-6 text-muted-foreground">
                <p>Your treasure chest is empty.</p>
                <Button onClick={onStumble} className="mt-space-2">
                  Explore now
                </Button>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                {favorites.map((item) => (
                  <li
                    key={item.id}
                    className="p-space-3 border rounded-md flex justify-between items-center"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium hover:text-accent truncate"
                    >
                      {item.title || item.url}
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemove(item.id)}
                      className="h-8 w-8 p-0"
                      aria-label="Remove from favorites"
                    >
                      ✖
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
