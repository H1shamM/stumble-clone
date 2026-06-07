import { renderHook, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const mockHandlers = {
    onNext: vi.fn(),
    onLike: vi.fn(),
    onDislike: vi.fn(),
    onToggleFavorites: vi.fn(),
    onToggleHistory: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
//... rest of the file
  it('should trigger onNext on "j" key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(mockHandlers.onNext).toHaveBeenCalled();
  });

  it('should trigger onLike on "k" key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    expect(mockHandlers.onLike).toHaveBeenCalled();
  });

  it('should trigger onDislike on "l" key', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }));
    expect(mockHandlers.onDislike).toHaveBeenCalled();
  });

  it('should not trigger if enabled is false', () => {
    renderHook(() => useKeyboardShortcuts({ ...mockHandlers, enabled: false }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }));
    expect(mockHandlers.onNext).not.toHaveBeenCalled();
  });

  it('should not trigger if target is an input', () => {
    renderHook(() => useKeyboardShortcuts(mockHandlers));
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }));
    expect(mockHandlers.onNext).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });
});
