/**
 * @fileoverview Coverage tests for App component.
 */

import { render, screen, fireEvent, waitFor, cleanup } from '../test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from '../App';

/**
 * Mock localStorage for testing.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

/**
 * Helper to setup default fetch mocks.
 */
const setupFetchMocks = () => {
    window.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/auth/register') || url.includes('/auth/login')) {
            return Promise.resolve({ 
                ok: true, 
                json: async () => ({ 
                    token: 'test-token', 
                    user: { id: 'dev-user', email: 'dev@stumble.local', display_name: 'Dev User' } 
                }) 
            });
        }
        if (url.includes('/favorites') || url.includes('/history') || url.includes('/recommendations') || url.includes('/stumble')) {
            return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" });
        }
        return Promise.resolve({ ok: true, json: async () => {}, text: async () => JSON.stringify({}) });
    });
};

describe('App Component Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'test-token');
    vi.clearAllMocks();
    setupFetchMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // TODO: Add test for network failure during initial mount fetches

  it('handles API errors', async () => {
    window.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/favorites') || url.includes('/history') || url.includes('/recommendations')) {
            return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" });
        }
        return Promise.resolve({ ok: false, statusText: 'Not Found' });
    });
    
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Try Again/i }));
    expect(window.fetch).toHaveBeenCalled();
  });

  it('removes favorites', async () => {
    window.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => [{ id: '1', url: 'https://test.com', title: 'Test' }] }) // favorites
        .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "[]" }) // history
        .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "[]" }) // recs
        .mockResolvedValueOnce({ ok: true }) // delete fav
        .mockResolvedValueOnce({ ok: true, json: async () => [], text: async () => "[]" }); // get favs after toggle
        
    render(<App />);
    
    // Toggle to open favorites
    await waitFor(() => expect(screen.getByRole('button', { name: /Favorites/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Favorites/i }));

    // Find and click remove button
    const removeBtn = await screen.findByLabelText("Remove from favorites");
    fireEvent.click(removeBtn);
    
    await waitFor(() => expect(screen.getByText(/No favorites yet/i)).toBeInTheDocument());
  });


  it('stumbles with random category', async () => {
    window.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/stumble')) {
        return Promise.resolve({
          ok: true,
          json: async () => { id: '456', url: 'https://wikipedia.org/wiki/Random', title: 'Random', category: 'random' }, text: async () => JSON.stringify({ id: '456', url: 'https://wikipedia.org/wiki/Random', title: 'Random', category: 'random' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" });
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
    expect(screen.getByText(/No history yet/i)).toBeInTheDocument();
  });

  it('filters by category tech', async () => {
    window.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/stumble')) {
        return Promise.resolve({
          ok: true,
          json: async () => { id: '789', url: 'https://dev.to/post', title: 'Tech', category: 'tech' }, text: async () => JSON.stringify({ id: '789', url: 'https://dev.to/post', title: 'Tech', category: 'tech' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => [], text: async () => "[]" });
    });
      
    render(<App />);
    const select = screen.getByLabelText(/Filter by:/i);
    fireEvent.change(select, { target: { value: 'tech' } });
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    await waitFor(() => expect(screen.getByTitle(/Stumbled page/i)).toBeInTheDocument());
  });
});
