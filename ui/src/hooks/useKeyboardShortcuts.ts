import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onNext: () => void;
  onLike: () => void;
  onDislike: () => void;
  onToggleFavorites: () => void;
  onToggleHistory: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNext,
  onLike,
  onDislike,
  onToggleFavorites,
  onToggleHistory,
  enabled = true,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'j':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          onLike();
          break;
        case 'ArrowDown':
        case 'l':
          e.preventDefault();
          onDislike();
          break;
        case 'f':
          e.preventDefault();
          onToggleFavorites();
          break;
        case 'h':
          e.preventDefault();
          onToggleHistory();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onNext, onLike, onDislike, onToggleFavorites, onToggleHistory]);
}
