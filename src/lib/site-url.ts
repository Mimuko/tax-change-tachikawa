/** Netlify の `URL` または `NEXT_PUBLIC_SITE_URL` から本番サイトの origin を解決する。 */
export function getSiteUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.URL;
  if (!raw) return undefined;

  try {
    const normalized = raw.endsWith("/") ? raw : `${raw}/`;
    return new URL(normalized);
  } catch {
    return undefined;
  }
}

export function buildShareUrl(input: { text: string; path: string }) {
  const params = new URLSearchParams({ text: input.text });
  const siteUrl = getSiteUrl();

  if (siteUrl) {
    const pageUrl = new URL(input.path.replace(/^\//, ""), siteUrl).toString();
    params.set("url", pageUrl);
  }

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}
