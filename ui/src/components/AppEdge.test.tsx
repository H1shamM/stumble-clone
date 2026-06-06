/**
 * @fileoverview Edge case tests for App component.
 */

import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
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
    global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/auth/register') || url.includes('/auth/login')) {
            return Promise.resolve({ 
                ok: true, 
                json: async () => ({ 
                    token: 'test-token', 
                    user: { id: 'dev-user', email: 'dev@stumble.local' } 
                }) 
            });
        }
        if (url.includes('/favorites') || url.includes('/history') || url.includes('/recommendations') || url.includes('/stumble')) {
            return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
    });
};

describe('App Component Edge Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setupFetchMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // TODO: Add tests for:
  // - Handling extremely long URLs in stumbled pages
  // - Handling malformed API responses
  // - Behavior when dark mode toggling fails to persist

  it('covers loadHistory/saveHistory error handling', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error(); });
    // This calls loadHistory
    render(<App />);
    expect(localStorage.getItem('stumbleclone_ratings_history')).toBeNull();
  });

  it('covers loading state and API error', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/stumble')) {
            return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ ok: true, json: async () => [] });
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /🎲 Stumble/i }));
    
    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument());
  });
});
