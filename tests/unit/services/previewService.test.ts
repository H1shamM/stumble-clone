import { describe, it, expect } from "vitest";
import { extractPreview } from "../../../app/src/services/previewService";

describe("extractPreview", () => {
  it("extracts og:title, og:description and an absolute og:image", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="Cool Site" />
        <meta property="og:description" content="A very cool site." />
        <meta property="og:image" content="https://cdn.example.com/card.png" />
        <meta property="og:site_name" content="Example" />
      </head><body></body></html>`;
    const p = extractPreview(html, "https://example.com/page");
    expect(p.title).toBe("Cool Site");
    expect(p.description).toBe("A very cool site.");
    expect(p.image).toBe("https://cdn.example.com/card.png");
    expect(p.siteName).toBe("Example");
  });

  it("resolves a relative og:image against the page URL", () => {
    const html = `<html><head>
      <meta property="og:image" content="/img/hero.jpg" />
    </head><body></body></html>`;
    const p = extractPreview(html, "https://site.test/a/b");
    expect(p.image).toBe("https://site.test/img/hero.jpg");
  });

  it("falls back to <title>, then hostname, when og tags are absent", () => {
    const withTitle = extractPreview(
      "<html><head><title>Plain Title</title></head><body></body></html>",
      "https://www.foo.test/x",
    );
    expect(withTitle.title).toBe("Plain Title");
    expect(withTitle.image).toBeNull();

    const bare = extractPreview("<html><body>hi</body></html>", "https://www.foo.test/x");
    expect(bare.title).toBe("foo.test");
    expect(bare.siteName).toBe("foo.test");
  });
});
