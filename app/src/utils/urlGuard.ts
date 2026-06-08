import { AppError } from "../middleware/errorHandler.js";

/**
 * Validates that a URL is an external http(s) target and rejects obvious
 * internal/private hosts. A basic SSRF guard for endpoints that fetch a
 * user-supplied URL (proxy, reader). Note: this checks the literal host only;
 * full protection (resolving DNS to catch rebinding) is a future hardening.
 *
 * @param targetUrl - The raw URL string from the request.
 * @returns The parsed URL when it is an allowed public http(s) target.
 */
export function assertPublicHttpUrl(targetUrl: string): URL {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    throw new AppError("Invalid URL", 400);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new AppError("Only http and https URLs are allowed", 400);
  }

  const host = url.hostname.toLowerCase();
  const isIPv6 = host.includes(":");
  const isPrivate =
    host === "localhost" ||
    host === "0.0.0.0" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("169.254.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    (isIPv6 &&
      (host === "::1" ||
        host.startsWith("fc") ||
        host.startsWith("fd") ||
        host.startsWith("fe80")));

  if (isPrivate) {
    throw new AppError("Blocked host", 400);
  }

  return url;
}
