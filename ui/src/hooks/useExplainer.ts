import { useState, useEffect } from "react";

export interface ExplainerResult {
  summary: string;
  keyPoints: string[];
  image: string | null;
  provenance: string;
  sourceUrl: string;
}

export function useExplainer(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string | null
) {
  const [data, setData] = useState<ExplainerResult | null>(null);
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

    authenticatedFetch(`/explainer?url=${encodeURIComponent(url)}`)
      .then(async (res) => {
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else if (res.status === 422) {
          setData(null);
          setError(null);
        } else {
          setError("Explainer unavailable");
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
