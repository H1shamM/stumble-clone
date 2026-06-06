import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App Component Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('handles API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found'
    });
    
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('removes favorites', async () => {
    localStorage.setItem('stumbleclone_favorites', JSON.stringify([{ url: 'https://test.com', title: 'Test', savedAt: 123 }]));
    render(<App />);
    
    fireEvent.click(screen.getByRole('button', { name: /Favorites/i }));
    const removeBtn = screen.getByLabelText(/Remove from favorites/i);
    fireEvent.click(removeBtn);
    
    expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument();
  });

  it('stumbles with random category', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 456, url: 'https://wikipedia.org/wiki/Random', title: 'Random', category: 'random' })
    });
    
    render(<App />);
    const select = screen.getByLabelText(/Filter by:/i);
    fireEvent.change(select, { target: { value: 'random' } });
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByTitle(/Stumbled page/i)).toBeInTheDocument());
  });

  it('shows empty state message in history', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /View History/i }));
    expect(screen.getByText(/No ratings yet/i)).toBeInTheDocument();
  });

  it('filters by category tech', async () => {
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 789, url: 'https://dev.to/post', title: 'Tech', category: 'tech' })
    });
    render(<App />);
    const select = screen.getByLabelText(/Filter by:/i);
    fireEvent.change(select, { target: { value: 'tech' } });
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    await waitFor(() => expect(screen.getByTitle(/Stumbled page/i)).toBeInTheDocument());
  });
});
