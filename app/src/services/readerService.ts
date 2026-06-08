/**
 * @fileoverview Reader-mode extraction: turn a page's HTML into clean, sanitized
 * article content suitable for rendering inside the app.
 */

import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import sanitizeHtml from "sanitize-html";

/**
 * The extracted, sanitized article returned to the client.
 */
export interface ReaderResult {
  title: string;
  byline: string | null;
  siteName: string | null;
  excerpt: string | null;
  /** Sanitized HTML — safe to render with dangerouslySetInnerHTML. */
  content: string;
  textContent: string;
  length: number;
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img",
    "figure",
    "figcaption",
    "picture",
    "source",
    "h1",
    "h2",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "srcset", "alt", "title", "width", "height", "loading"],
    a: ["href", "name", "target", "rel"],
    source: ["src", "srcset", "type", "media", "sizes"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Force external links to open safely in a new tab.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
};

/**
 * Extract readable article content from raw HTML.
 *
 * @param html - The page's raw HTML.
 * @param url - The page URL (used to resolve relative links/images).
 * @returns The sanitized article, or `null` when the page isn't article-like.
 */
export function extractReadable(
  html: string,
  url: string,
): ReaderResult | null {
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  if (!article || !article.content) return null;

  const content = sanitizeHtml(article.content, SANITIZE_OPTIONS);
  if (!content.trim()) return null;

  return {
    title: article.title ?? "",
    byline: article.byline ?? null,
    siteName: article.siteName ?? null,
    excerpt: article.excerpt ?? null,
    content,
    textContent: article.textContent ?? "",
    length: article.length ?? 0,
  };
}
