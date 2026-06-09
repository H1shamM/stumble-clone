/**
 * @fileoverview Preview extraction: pull a page's social/meta card (og:image,
 * title, description, favicon) so the UI can render a rich preview for content
 * that can't be embedded in an iframe (interactive sites, image galleries).
 * This is the "screenshot-preview" fallback the modern StumbleUpon successors use
 * — most of the interesting web refuses to be framed (X-Frame-Options/CSP).
 */

import { JSDOM } from "jsdom";

export interface PreviewResult {
  /** Best available title (og:title → twitter:title → <title> → hostname). */
  title: string;
  /** Short description, when the page advertises one. */
  description: string | null;
  /** Absolute URL of the preview image (og:image / twitter:image), if any. */
  image: string | null;
  /** Human site name (og:site_name → hostname). */
  siteName: string;
  /** Absolute favicon URL, best-effort. */
  favicon: string | null;
}

/** Resolve a possibly-relative URL against the page URL; null on failure. */
function absolutize(value: string | null | undefined, base: string): string | null {
  if (!value) return null;
  try {
    return new URL(value, base).href;
  } catch {
    return null;
  }
}

/**
 * Extract a preview card from raw HTML. Always returns a usable result (falls
 * back to the hostname for the title), so the UI never shows an empty card.
 */
export function extractPreview(html: string, url: string): PreviewResult {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  })();

  let doc: Document;
  try {
    doc = new JSDOM(html).window.document;
  } catch {
    return { title: hostname, description: null, image: null, siteName: hostname, favicon: null };
  }

  const meta = (selector: string): string | null =>
    doc.querySelector(selector)?.getAttribute("content")?.trim() || null;

  const title =
    meta('meta[property="og:title"]') ||
    meta('meta[name="twitter:title"]') ||
    doc.querySelector("title")?.textContent?.trim() ||
    hostname;

  const description =
    meta('meta[property="og:description"]') ||
    meta('meta[name="twitter:description"]') ||
    meta('meta[name="description"]');

  const image = absolutize(
    meta('meta[property="og:image"]') ||
      meta('meta[property="og:image:url"]') ||
      meta('meta[name="twitter:image"]'),
    url,
  );

  const siteName = meta('meta[property="og:site_name"]') || hostname;

  const faviconHref =
    doc.querySelector('link[rel~="icon"]')?.getAttribute("href") ||
    doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
    "/favicon.ico";
  const favicon = absolutize(faviconHref, url);

  return { title, description, image, siteName, favicon };
}
