import { useState, useCallback, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface StumbleResult {
  id: string;
  url: string;
  proxyUrl?: string;
  title?: string;
  description?: string;
  category: string;
  source: string;
}

export function useStumble(authenticatedFetch: any, category: string) {
  const [current, setCurrent] = useState<StumbleResult | null>(null);
  const [nextStumble, setNextStumble] = useState<StumbleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIframe, setShowIframe] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const iframeLoadedRef = useRef(false);
  const iframeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setNextStumble(null);
  }, [category]);

  const clearIframeTimeout = useCallback(() => {
    if (iframeTimeoutRef.current) {
      clearTimeout(iframeTimeoutRef.current);
      iframeTimeoutRef.current = null;
    }
  }, []);

  const setBlockedState = useCallback(() => {
    console.log('Iframe blocked or timed out, showing fallback');
    setIframeError(true);
    clearIframeTimeout();
    if (current) {
      authenticatedFetch(`/rate`, {
        method: 'POST',
        body: JSON.stringify({ assetId: current.id, isPositive: false, note: 'blocked' }),
      }).catch(console.error);
    }
  }, [current, authenticatedFetch, clearIframeTimeout]);

  const startIframeTimeout = useCallback(() => {
    clearIframeTimeout();
    iframeLoadedRef.current = false;
    iframeTimeoutRef.current = setTimeout(() => {
      if (!iframeLoadedRef.current) {
        setBlockedState();
      }
    }, 5000); // 5 seconds for slow sites
  }, [clearIframeTimeout, setBlockedState]);

  const prefetchNext = useCallback(async () => {
    try {
      const res = await authenticatedFetch(`/stumble?category=${category}`);
      if (!res.ok) return;
      const data: StumbleResult = await res.json();
      data.proxyUrl = `${API_BASE}/proxy?url=${encodeURIComponent(data.url)}`;
      setNextStumble(data);
    } catch (err) {
      console.debug('Prefetch failed', err);
      setNextStumble(null);
    }
  }, [category, authenticatedFetch]);

  const fetchStumble = useCallback(async () => {
    // If we have a pre-fetched next stumble, use it
    if (nextStumble) {
      setCurrent(nextStumble);
      setShowIframe(true);
      setLoading(false);
      setIframeError(false);
      setNextStumble(null);
      startIframeTimeout();
      
      // Pre-fetch another one in the background
      prefetchNext();
      return;
    }

    setLoading(true);
    setError(null);
    setShowIframe(false);
    setIframeError(false);
    iframeLoadedRef.current = false;
    clearIframeTimeout();

    try {
      const res = await authenticatedFetch(`/stumble?category=${category}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to fetch stumble: ${res.status} - ${text.slice(0, 100)}`);
      }
      const data: StumbleResult = await res.json();
      
      // Add proxy URL
      data.proxyUrl = `${API_BASE}/proxy?url=${encodeURIComponent(data.url)}`;
      setCurrent(data);
      setShowIframe(true);
      startIframeTimeout();
      
      // Pre-fetch another one
      prefetchNext();
    } catch (err: unknown) {
      console.error('Stumble fetch error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [category, authenticatedFetch, clearIframeTimeout, startIframeTimeout, nextStumble, prefetchNext]);

  const handleClose = useCallback(() => {
    setShowIframe(false);
    setIframeError(false);
    clearIframeTimeout();
    iframeLoadedRef.current = false;
  }, [clearIframeTimeout]);

  const handleIframeLoad = useCallback(() => {
    console.log('Iframe loaded successfully');
    iframeLoadedRef.current = true;
    clearIframeTimeout();
    setIframeError(false);
  }, [clearIframeTimeout]);

  return {
    current,
    nextStumble,
    loading,
    error,
    showIframe,
    iframeError,
    fetchStumble,
    handleClose,
    handleIframeLoad,
  };
}
