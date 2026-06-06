/**
 * @fileoverview Unit tests for App component.
 */

import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

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
        if (url.includes('/auth/me')) {
            return Promise.resolve({
                ok: true,
                json: async () => ({ id: 'dev-user', email: 'dev@stumble.local', display_name: 'Dev User' })
            });
        }
        if (url.includes('/favorites') || url.includes('/history') || url.includes('/recommendations')) {
            return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
    });
};

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setupFetchMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders initial empty state with Stumble button', () => {
    render(<App />);
    expect(screen.getByText(/Click/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /🎲 Stumble/i })).toBeInTheDocument();
  });

  it('liking updates history and localStorage', async () => {
    window.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'test-token', user: { id: 'dev-user', email: 'dev@stumble.local' } }) }) // auth/register
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // favorites
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // history
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // recs
      .mockResolvedValueOnce({ // stumble
        ok: true,
        json: async () => ({ id: '123', url: 'https://example.com', title: 'Test', category: 'tech', source: 'HN' })
      })
      .mockResolvedValueOnce({ ok: true }) // rate
      .mockResolvedValueOnce({ ok: true }) // pref1
      .mockResolvedValueOnce({ ok: true }) // pref2
      .mockResolvedValueOnce({ ok: true, json: async () => [{ rating_val: 'like', url: 'https://example.com' }] }); // history

    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: /🎲 Stumble/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByLabelText('Like')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Like'));
    
    await waitFor(() => {
        expect(screen.getByText(/View History \(1\)/i)).toBeInTheDocument();
    });
  });

  it('favorites toggle works', async () => {
    window.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ token: 'test-token', user: { id: 'dev-user', email: 'dev@stumble.local' } }) }) // auth/register
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // favorites
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // history
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // recs
      .mockResolvedValueOnce({ // stumble
        ok: true,
        json: async () => ({ id: '123', url: 'https://example.com', title: 'Test', category: 'tech', source: 'HN' })
      })
      .mockResolvedValueOnce({ ok: true }) // save fav
      .mockResolvedValueOnce({ ok: true, json: async () => [{ id: '123', url: 'https://example.com', title: 'Test' }] }); // get favs after toggle

    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: /🎲 Stumble/i })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByLabelText('Save to favorites')).toBeInTheDocument());
    const favBtn = screen.getByLabelText('Save to favorites');
    
    fireEvent.click(favBtn);
    
    await waitFor(() => {
        expect(favBtn.textContent).toBe('⭐');
    });
  });

  it('dark mode toggles theme and persists', () => {
    render(<App />);
    const header = screen.getByRole('banner');
    const toggle = within(header).getByRole('button', { name: 'Toggle theme' });
    
    fireEvent.click(toggle);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('shows profile modal when clicking user button', async () => {
    render(<App />);
    const userButton = await screen.findByText(/Dev User/i);
    fireEvent.click(userButton);
    expect(screen.getByText(/Stumbles/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });
});
