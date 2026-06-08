export const sourceFaviconMap: Record<string, string> = {
  "Hacker News": "https://news.ycombinator.com/favicon.ico",
  Wikipedia: "https://www.wikipedia.org/favicon.ico",
  Reddit: "https://www.reddit.com/favicon.ico",
  "Dev.to": "https://dev.to/favicon.ico",
  "GitHub Trending": "https://github.com/favicon.ico",
  Medium: "https://medium.com/favicon.ico",
  YouTube: "https://youtube.com/favicon.ico",
  UselessWeb: "https://theuselessweb.com/favicon.ico",
  AtlasObscura: "https://www.atlasobscura.com/favicon.ico",
  BoredPanda: "https://www.boredpanda.com/favicon.ico",
};

export function getFaviconUrl(source: string): string {
  return (
    sourceFaviconMap[source] ||
    "https://www.google.com/s2/favicons?domain=example.com"
  );
}

export function estimateReadingTime(text: string | undefined): string | null {
  if (!text || text.length < 50) return null;
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}
