/**
 * Security utilities for link validation, remote asset sanitization, and image beacon protection.
 * Follows Fox Planning Document Section 4.2 & 7.2.
 */

const SAFE_EXTERNAL_PROTOCOL = /^(https?:|mailto:)/i;

/**
 * Validate that a Markdown link href does not execute arbitrary scripts or unsafe protocols.
 */
export function isSafeLinkHref(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (trimmed.startsWith('#')) return true;
  return SAFE_EXTERNAL_PROTOCOL.test(trimmed);
}

/**
 * Check if an image source URL points to an external remote network endpoint.
 * Local paths, asset:// protocol, data: and blob: URLs are NOT considered remote.
 */
export function isRemoteImageUrl(src?: string): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  if (/^(data:|blob:)/i.test(trimmed)) return false;
  if (/^(https?:|\/\/)/i.test(trimmed)) return true;
  return false;
}

/**
 * Extract clean lowercase hostname from a remote image URL.
 * Returns empty string if invalid or non-URL.
 */
export function extractImageHostname(src?: string): string {
  if (!src) return '';
  const trimmed = src.trim();
  try {
    const normalized = trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;
    const parsed = new URL(normalized);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Check if an image hostname matches or is a subdomain of any trusted domain.
 * e.g. "images.unsplash.com" is trusted if "unsplash.com" or "images.unsplash.com" is in trustedDomains.
 */
export function isImageDomainTrusted(hostname?: string, trustedDomains: string[] = []): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase().trim();
  if (!host) return false;

  return trustedDomains.some((trusted) => {
    const t = trusted.toLowerCase().trim();
    if (!t) return false;
    return host === t || host.endsWith(`.${t}`);
  });
}
