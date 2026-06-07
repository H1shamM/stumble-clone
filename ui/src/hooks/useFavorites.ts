import { useState, useEffect, useCallback } from 'react';
import type { AuthenticatedFetch } from '../types';
import type { StumbleResult } from './useStumble';

const safeJson = async (res: Response) => {
  const text = await res.text();
  if (!text || text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export function useFavorites(authenticatedFetch: AuthenticatedFetch) {
  const [favorites, setFavorites] = useState<StumbleResult[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetch('/favorites');
      if (res.ok) {
        const data = await safeJson(res);
        setFavorites(Array.isArray(data) ? data : []);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Failed to load favorites', err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [authenticatedFetch]);

  const toggleFavorite = useCallback(async (asset: StumbleResult | null) => {
    if (!asset) return;
    const isFav = favorites.some(f => f.id === asset.id);
    try {
      if (isFav) {
        await authenticatedFetch(`/favorites/${asset.id}`, { method: 'DELETE' });
      } else {
        await authenticatedFetch('/favorites', {
          method: 'POST',
          body: JSON.stringify({ assetId: asset.id }),
        });
      }
      await loadFavorites();
    } catch (err) {
      console.error('Favorite toggle failed', err);
    }
  }, [favorites, authenticatedFetch, loadFavorites]);

  const removeFavorite = useCallback(async (assetId: string) => {
    try {
      await authenticatedFetch(`/favorites/${assetId}`, { method: 'DELETE' });
      await loadFavorites();
    } catch (err) {
      console.error('Favorite removal failed', err);
    }
  }, [authenticatedFetch, loadFavorites]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFavorites();
  }, [loadFavorites]);

  return {
    favorites,
    showFavorites,
    setShowFavorites,
    toggleFavorite,
    removeFavorite,
    isFavorite: (asset: StumbleResult | null) => asset ? favorites.some(f => f.id === asset.id) : false,
    loading,
  };
}
