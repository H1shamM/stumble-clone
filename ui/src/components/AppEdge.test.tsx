import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App Component Edge Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('covers loadHistory/saveHistory error handling', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error(); });
    // This calls loadHistory
    render(<App />);
    expect(localStorage.getItem('stumbleclone_ratings_history')).toBeNull();
  });

  it('covers loading state and API error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument());
  });
});
