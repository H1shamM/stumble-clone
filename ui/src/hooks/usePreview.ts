import { useState, useEffect } from "react";

export interface PreviewResult {
  title: string;
  description: string | null;
  image: string | null;
  siteName: string;
  favicon: string | null;
}

/**
 * Fetches a preview card (og:image + metadata) for a URL that can't be embedded
 * inline. Mirrors useReader. `null` url is a no-op.
 */
export function usePreview(
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>,
  url: string | null,
) {
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    authenticatedFetch(`/preview?url=${encodeURIComponent(url)}`)
      .then(async (res) => {
        if (!active) return;
        if (res.ok) setData(await res.json());
        else setData(null);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authenticatedFetch, url]);

  return { data, loading };
}
