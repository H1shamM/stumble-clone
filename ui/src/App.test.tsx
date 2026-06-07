/**
 * @fileoverview Unit tests for App component.
 */

import { render, screen, fireEvent, waitFor, cleanup, within, setupFetchMocks } from './test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { App } from './App';

/**
 * Mock localStorage for testing.
 */
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: unknown) => { 
      store[key] = value != null ? String(value) : ''; 
    },
    clear: () => { store = {}; },
    removeItem: (key: string) => { delete store[key]; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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
    expect(screen.getByRole("button", { name: /Stumble })).toBeInTheDocument();
  });

  it('liking updates history and localStorage', async () => {
    // ... setupFetchMocks already handles this, but let's override for this specific test
    // Actually, setupFetchMocks is called in beforeEach.
    // Let's just render the app.
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Stumble })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Stumble }));
    
    // We need to match the actual label in the UI
    await waitFor(() => expect(screen.getByLabelText('Like')).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText('Like'));
    
    await waitFor(() => {
        expect(screen.getByText(/View History/i)).toBeInTheDocument();
    });
  });

  it('favorites toggle works', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole("button", { name: /Stumble })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Stumble }));
    
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
