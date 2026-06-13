import { useState, useEffect } from "react";

export interface ReaderResult {
  title: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
  content: string;
  textContent: string;
  length: number;
}

export function useReader(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string | null,
) {
  const [data, setData] = useState<ReaderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);

      setLoading(false);

      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    authenticatedFetch(`/reader?url=${encodeURIComponent(url)}`)
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError("Could not load reader view");
        }
      })
      .catch(() => {
        if (!active) return;
        setError("Network error");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authenticatedFetch, url]);

  return { data, loading, error };
}
