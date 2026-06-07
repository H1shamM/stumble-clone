import type { Request, Response } from 'express';
import { fetchHtml } from '../utils/fetchHtml.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Simple HTML rewriter that injects a <base> tag to make relative URLs absolute.
 */
function makeAbsolute(html: string, baseUrl: string): string {
  const baseTag = `<base href="${baseUrl}">`;
  if (html.includes('<head>')) {
    return html.replace('<head>', `<head>${baseTag}`);
  }
  if (html.includes('<html>')) {
    return html.replace('<html>', `<html><head>${baseTag}</head>`);
  }
  return `${baseTag}${html}`;
}

export class ProxyController {
  async proxy(req: Request, res: Response) {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      throw new AppError('Missing url parameter', 400);
    }

    // Validate URL to prevent SSRF attacks
    let url: URL;
    try {
      url = new URL(targetUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Only http and https allowed');
      }
    } catch {
      throw new AppError('Invalid URL', 400);
    }

    try {
      const { html } = await fetchHtml(targetUrl);
      
      // Remove restrictive headers
      res.removeHeader('X-Frame-Options');
      res.removeHeader('Content-Security-Policy');
      // Allow embedding
      res.setHeader('X-Frame-Options', 'ALLOWALL');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      
      // Make relative links absolute
      const rewrittenHtml = makeAbsolute(html, targetUrl);
      
      res.send(rewrittenHtml);
    } catch (error: unknown) {
      console.error('Proxy error:', error);
      res.status(502).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 2rem;">
            <h1>Cannot load ${targetUrl}</h1>
            <p>${error.message}</p>
            <a href="${targetUrl}" target="_blank">Open directly in new tab</a>
            <br/><br/>
            <button onclick="window.location.reload()">Try again</button>
          </body>
        </html>
      `);
    }
  }
}